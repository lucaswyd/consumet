import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';
import { StreamingServers } from '@consumet/extensions/dist/models';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const nineanime = new ANIME.NineAnime(
    process.env.NINE_ANIME_HELPER_URL,
    {
      url: process.env.NINE_ANIME_PROXY as string,
    },
    process.env?.NINE_ANIME_HELPER_KEY as string
  );

  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the 9anime provider: check out the provider's website @ https://9anime.id/",
      routes: ['/:query', '/info/:id', '/watch/:episodeId'],
      documentation: 'https://docs.consumet.org/#tag/9anime',
    });
  });

  fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.params as { query: string }).query;

    const page = (request.query as { page: number }).page;

    const res = await nineanime.search(query, page);

    reply.status(200).send(res);
  });

  fastify.get('/info/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.params as { id: string }).id;

    if (typeof id === 'undefined')
      return reply.status(400).send({ message: 'id is required' });

    try {
      const res = await nineanime.fetchAnimeInfo(id);

      reply.status(200).send(res);
    } catch (err) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Contact developer for help.' });
    }
  });

  fastify.get(
    '/watch/:episodeId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as { episodeId: string }).episodeId;

      const server = (request.query as { server: string }).server as StreamingServers;

      if (server && !Object.values(StreamingServers).includes(server))
        return reply.status(400).send({ message: 'server is invalid' });

      if (typeof episodeId === 'undefined')
        return reply.status(400).send({ message: 'id is required' });

      try {
        const res = await nineanime.fetchEpisodeSources(episodeId, server);

        reply.status(200).send(res);
      } catch (err) {
        console.error(err);
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developer for help.' });
      }
    }
  );

  fastify.get(
    '/servers/:episodeId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as { episodeId: string }).episodeId;

      try {
        const res = await nineanime.fetchEpisodeServers(episodeId);

        reply.status(200).send(res);
      } catch (err) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Please try again later.' });
      }
    }
  );
};

export default routes;
