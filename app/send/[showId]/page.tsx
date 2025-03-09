import SendMessageClient from '../[showId]/SendMessageClient'
import { notFound } from 'next/navigation'
import prisma from '../../../src/lib/prisma'
export default async function SendMessagePage({ params }: { params: { showId: string } }) {
  // Sunucu tarafında showId kontrolü
  const show = await prisma.show.findUnique({
    where: {
      id: params.showId,
      active: true
    },
    include: {
      user: {  // dj yerine user kullanıyoruz
        select: {
          name: true,
          settings: true
        }
      }
    }
  })
  
  if (!show) {
    return notFound()
  }
  
  return <SendMessageClient show={show} />
}