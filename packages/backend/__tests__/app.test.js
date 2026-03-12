const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (fields = {}) => {
  const body = { name: 'Test Item', ...fields };
  const response = await request(app)
    .post('/api/items')
    .send(body)
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/items', () => {
    it('should return all items ordered by position', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('due_date');
      expect(item).toHaveProperty('position');
      expect(item).toHaveProperty('created_at');
    });

    it('should return items in ascending position order', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      const positions = response.body.map((i) => i.position);
      const sorted = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sorted);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with required name only', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Simple Task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Simple Task');
      expect(response.body.description).toBeNull();
      expect(response.body.due_date).toBeNull();
      expect(response.body).toHaveProperty('position');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create a new item with description and due_date', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Full Task', description: 'Some details', due_date: '2026-12-31' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Full Task');
      expect(response.body.description).toBe('Some details');
      expect(response.body.due_date).toBe('2026-12-31');
    });

    it('should assign incrementing position to new items', async () => {
      const first = await createItem({ name: 'Position A' });
      const second = await createItem({ name: 'Position B' });
      expect(second.position).toBe(first.position + 1);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update the name of an existing item', async () => {
      const item = await createItem({ name: 'Original Name' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.id).toBe(item.id);
    });

    it('should update the description of an existing item', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ description: 'A new description' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('A new description');
    });

    it('should update the due_date of an existing item', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ due_date: '2026-06-15' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBe('2026-06-15');
    });

    it('should preserve existing fields when only updating one field', async () => {
      const item = await createItem({ name: 'Task', description: 'Keep me', due_date: '2026-01-01' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: 'New Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('Keep me');
      expect(response.body.due_date).toBe('2026-01-01');
    });

    it('should clear due_date when sent as null', async () => {
      const item = await createItem({ name: 'Task', due_date: '2026-01-01' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ due_date: null })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBeNull();
    });

    it('should return 404 if item does not exist', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Ghost' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 if name is an empty string', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/items/:id/position', () => {
    it('should move an item down', async () => {
      const first = await createItem({ name: 'First' });
      const second = await createItem({ name: 'Second' });

      const response = await request(app)
        .patch(`/api/items/${first.id}/position`)
        .send({ direction: 'down' });

      expect(response.status).toBe(200);
      const updatedFirst = response.body.find((i) => i.id === first.id);
      const updatedSecond = response.body.find((i) => i.id === second.id);
      expect(updatedFirst.position).toBeGreaterThan(updatedSecond.position);
    });

    it('should move an item up', async () => {
      const first = await createItem({ name: 'Up-A' });
      const second = await createItem({ name: 'Up-B' });

      const response = await request(app)
        .patch(`/api/items/${second.id}/position`)
        .send({ direction: 'up' });

      expect(response.status).toBe(200);
      const updatedFirst = response.body.find((i) => i.id === first.id);
      const updatedSecond = response.body.find((i) => i.id === second.id);
      expect(updatedSecond.position).toBeLessThan(updatedFirst.position);
    });

    it('should return 400 when moving the top item up', async () => {
      const allItems = await request(app).get('/api/items');
      const topItem = allItems.body[0];

      const response = await request(app)
        .patch(`/api/items/${topItem.id}/position`)
        .send({ direction: 'up' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid direction', async () => {
      const item = await createItem({ name: 'Task' });

      const response = await request(app)
        .patch(`/api/items/${item.id}/position`)
        .send({ direction: 'sideways' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'direction must be "up" or "down"');
    });

    it('should return 404 if item does not exist', async () => {
      const response = await request(app)
        .patch('/api/items/999999/position')
        .send({ direction: 'up' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem({ name: 'Item To Be Deleted' });

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});
