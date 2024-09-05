(async () => {
    const chai = await import('chai'); 
    const chaiHttp = await import('chai-http');
    const index = require('../index'); 
  
    const { expect } = chai.default; 
    chai.default.use(chaiHttp.default);
  
    describe('Auth Controller', () => {
      describe('POST /auth/register', () => {
        it('should register a new user', (done) => {
          chai.default.request(index)
            .post('/api/auth/register')
            .send({
              username: 'testuser',
              email: 'testuser@example.com',
              password: 'password123'
            })
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body).to.have.property('message', 'User created successfully');
              done();
            });
        });
  
        it('should not register an existing user', (done) => {
          chai.default.request(index)
            .post('/api/auth/register')
            .send({
              username: 'testuser',
              email: 'testuser@example.com',
              password: 'password123'
            })
            .end((err, res) => {
              expect(res).to.have.status(409);
              expect(res.body).to.have.property('message', 'User already exists');
              done();
            });
        });
      });
    });
  
    run(); 
  })();
  