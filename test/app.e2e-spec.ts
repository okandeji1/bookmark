import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common/pipes';
import { Test } from '@nestjs/testing';
import pactum from 'pactum';
import { AuthDto } from 'src/auth/dto/auth.dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';
import { EditUserDto } from 'src/user/dto/edit-user.dto';
import { AppModule } from '../src/app.module';

describe('App e2e', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(2000);

    pactum.request.setBaseUrl('http://localhost:6000/api');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      firstName: 'fatai',
      lastName: 'fatai',
      email: 'okandeji2012@gmail.com',
      password: '1234567',
    };

    describe('SignUp', () => {
      it('Should throw exception if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw exception if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw exception if no body provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('SignIn', () => {
      it('Should throw exception if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw exception if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw exception if no body provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('Should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
            password: dto.password,
          })
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'fatai',
        lastName: 'fatai',
        email: 'okandeji2012@gmail.com',
      };
      it('Should edit user', () => {
        return pactum
          .spec()
          .patch('/users/edit/id')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should get empty bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Get bookmarks', () => {
      it('Should get bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Create bookmark', () => {
      it('Should create bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'First Bookmark',
          description: 'Lorem ipsum dolor',
          link: 'https://github.com/okandeji1',
        };

        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .expectBody(dto.title)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmark by id', () => {
      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'First Bookmark',
        description: 'Lorem ipsum dolor',
        link: 'https://github.com/okandeji1',
      };

      it('Should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title);
      });
    });

    describe('Delete bookmark by id', () => {
      it('Should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    it('Should get empty bookmarks', () => {
      return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(0);
    });
  });
});
