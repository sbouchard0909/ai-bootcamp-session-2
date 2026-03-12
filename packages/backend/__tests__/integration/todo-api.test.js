const request = require('supertest');
const { app, db } = require('../../src/app');

// Reset and re-seed the database before each test for full isolation
beforeEach(() => {
  db.exec('DELETE FROM items');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'items'");
  const seed = db.prepare('INSERT INTO items (name, position) VALUES (?, ?)');
  seed.run('Item 1', 1);
  seed.run('Item 2', 2);
  seed.run('Item 3', 3);
});

afterAll(() => {
  if (db) db.close();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const get = () => request(app).get('/api/items');
const post = (body) =>
  request(app).post('/api/items').send(body).set('Accept', 'application/json');
const put = (id, body) =>
  request(app).put(`/api/items/${id}`).send(body).set('Accept', 'application/json');
const patch = (id, direction) =>
  request(app)
    .patch(`/api/items/${id}/position`)
    .send({ direction })
    .set('Accept', 'application/json');
const del = (id) => request(app).delete(`/api/items/${id}`);

// ---------------------------------------------------------------------------
// 1. Full CRUD lifecycle
// ---------------------------------------------------------------------------

describe('Full CRUD lifecycle', () => {
  it('creates a task, reads it back, updates it, then deletes it', async () => {
    // Create
    const createRes = await post({ name: 'My Task', description: 'Do the thing', due_date: '2026-04-01' });
    expect(createRes.status).toBe(201);
    const { id } = createRes.body;
    expect(createRes.body.name).toBe('My Task');
    expect(createRes.body.description).toBe('Do the thing');
    expect(createRes.body.due_date).toBe('2026-04-01');

    // Read — should appear in the list
    const listRes = await get();
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((t) => t.id === id);
    expect(found).toBeDefined();
    expect(found.name).toBe('My Task');

    // Update
    const updateRes = await put(id, { name: 'Updated Task', due_date: null });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated Task');
    expect(updateRes.body.due_date).toBeNull();
    expect(updateRes.body.description).toBe('Do the thing'); // unchanged

    // Read again — reflects the update
    const afterUpdateRes = await get();
    const updated = afterUpdateRes.body.find((t) => t.id === id);
    expect(updated.name).toBe('Updated Task');
    expect(updated.due_date).toBeNull();

    // Delete
    const deleteRes = await del(id);
    expect(deleteRes.status).toBe(200);

    // Read again — should be gone
    const afterDeleteRes = await get();
    const deleted = afterDeleteRes.body.find((t) => t.id === id);
    expect(deleted).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Position / reordering workflow
// ---------------------------------------------------------------------------

describe('Reordering workflow', () => {
  it('reflects correct order after multiple moves', async () => {
    // Seed gives us: [Item 1(pos1), Item 2(pos2), Item 3(pos3)]
    const initial = await get();
    expect(initial.body.map((t) => t.name)).toEqual(['Item 1', 'Item 2', 'Item 3']);

    const [item1, item2, item3] = initial.body;

    // Move Item 3 up once → [Item 1, Item 3, Item 2]
    const moveUp1 = await patch(item3.id, 'up');
    expect(moveUp1.status).toBe(200);
    expect(moveUp1.body.map((t) => t.name)).toEqual(['Item 1', 'Item 3', 'Item 2']);

    // Move Item 3 up again → [Item 3, Item 1, Item 2]
    const moveUp2 = await patch(item3.id, 'up');
    expect(moveUp2.status).toBe(200);
    expect(moveUp2.body.map((t) => t.name)).toEqual(['Item 3', 'Item 1', 'Item 2']);

    // Verify the final order is persisted (GET reflects it)
    const finalList = await get();
    expect(finalList.body.map((t) => t.name)).toEqual(['Item 3', 'Item 1', 'Item 2']);

    // Positions must remain strictly ascending with no gaps after swaps
    const positions = finalList.body.map((t) => t.position);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('prevents moving the top item up', async () => {
    const list = await get();
    const topItem = list.body[0];

    const res = await patch(topItem.id, 'up');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/top/i);
  });

  it('prevents moving the bottom item down', async () => {
    const list = await get();
    const bottomItem = list.body[list.body.length - 1];

    const res = await patch(bottomItem.id, 'down');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/bottom/i);
  });

  it('returns consistent order in GET after item deletion mid-list', async () => {
    // Delete the middle item
    const list = await get();
    const middleItem = list.body[1]; // Item 2
    await del(middleItem.id);

    // Remaining items must still be sorted by position
    const after = await get();
    expect(after.body).toHaveLength(2);
    expect(after.body[0].name).toBe('Item 1');
    expect(after.body[1].name).toBe('Item 3');
    expect(after.body[0].position).toBeLessThan(after.body[1].position);
  });
});

// ---------------------------------------------------------------------------
// 3. Description and due_date field workflow
// ---------------------------------------------------------------------------

describe('Optional fields workflow', () => {
  it('creates a task with all optional fields and reads them back accurately', async () => {
    const res = await post({
      name: 'Full Task',
      description: 'A thorough description',
      due_date: '2026-06-15',
    });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('A thorough description');
    expect(res.body.due_date).toBe('2026-06-15');

    const list = await get();
    const found = list.body.find((t) => t.id === res.body.id);
    expect(found.description).toBe('A thorough description');
    expect(found.due_date).toBe('2026-06-15');
  });

  it('updates only the description, leaving name and due_date unchanged', async () => {
    const created = await post({ name: 'Partial Update Task', description: 'Old desc', due_date: '2026-03-01' });
    const { id } = created.body;

    const updated = await put(id, { description: 'New desc' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Partial Update Task');
    expect(updated.body.description).toBe('New desc');
    expect(updated.body.due_date).toBe('2026-03-01');
  });

  it('clears optional fields by sending null', async () => {
    const created = await post({ name: 'Clear Fields Task', description: 'Some notes', due_date: '2026-05-01' });
    const { id } = created.body;

    const cleared = await put(id, { description: null, due_date: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.description).toBeNull();
    expect(cleared.body.due_date).toBeNull();
    expect(cleared.body.name).toBe('Clear Fields Task');

    // Verify persistence
    const list = await get();
    const found = list.body.find((t) => t.id === id);
    expect(found.description).toBeNull();
    expect(found.due_date).toBeNull();
  });

  it('omits optional fields on creation (should be null by default)', async () => {
    const res = await post({ name: 'Name Only Task' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBeNull();
    expect(res.body.due_date).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Position assignment on creation
// ---------------------------------------------------------------------------

describe('Position assignment workflow', () => {
  it('assigns positions sequentially and new items appear last in GET', async () => {
    const first = await post({ name: 'New Task A' });
    const second = await post({ name: 'New Task B' });
    const third = await post({ name: 'New Task C' });

    expect(first.body.position).toBeLessThan(second.body.position);
    expect(second.body.position).toBeLessThan(third.body.position);

    const list = await get();
    const names = list.body.map((t) => t.name);
    const aIdx = names.indexOf('New Task A');
    const bIdx = names.indexOf('New Task B');
    const cIdx = names.indexOf('New Task C');

    // New tasks appear after the seeded items; C must be after B, B after A
    expect(aIdx).toBeLessThan(bIdx);
    expect(bIdx).toBeLessThan(cIdx);
  });
});

// ---------------------------------------------------------------------------
// 5. Error handling across the lifecycle
// ---------------------------------------------------------------------------

describe('Error handling across the lifecycle', () => {
  it('returns 404 when updating a deleted item', async () => {
    const created = await post({ name: 'Soon Deleted' });
    const { id } = created.body;

    await del(id);

    const res = await put(id, { name: 'Ghost Update' });
    expect(res.status).toBe(404);
  });

  it('returns 404 when moving a deleted item', async () => {
    const created = await post({ name: 'Soon Deleted' });
    const { id } = created.body;

    await del(id);

    const res = await patch(id, 'up');
    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent item', async () => {
    const res = await del(99999);
    expect(res.status).toBe(404);
  });

  it('GET returns an empty array when all items are deleted', async () => {
    const list = await get();
    for (const item of list.body) {
      await del(item.id);
    }

    const afterAll = await get();
    expect(afterAll.status).toBe(200);
    expect(afterAll.body).toEqual([]);
  });
});
