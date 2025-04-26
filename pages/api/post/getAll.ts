import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'prisma/prisma';

const get: NextApiHandler = async (
	req: NextApiRequest,
	res: NextApiResponse
) => {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const posts = await prisma.post.findMany({
		where: {
			replyToId: {
				equals: null,
			},
		},
		orderBy: [
			{
				createdAt: 'desc',
			},
		],
		include: {
			author: true,
			likes: true,
		},
	});

	if (!posts) {
		return res.status(500).send({ error: `Couldn't create posts` });
	}

	return res.status(200).json(posts);
};
export default get;
