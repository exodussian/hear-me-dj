import SendMessageClient from '../[showId]/SendMessageClient'
import { notFound } from 'next/navigation'
import prisma from '../../../src/lib/prisma'



  export default async function SendMessagePage({ params }: { params: { showId: string } }) {
    // Sunucu tarafında showId kontrolü
    try {
      const show = await prisma.show.findUnique({
        where: {
          id: params.showId,
          active: true
        },
        include: {
          user: {
            select: {
              name: true,
              settings: true
            }
          }
        }
      });
      
      if (!show) {
        return notFound();
      }
      
      // Verileri SendMessageClient'ın beklediği formata dönüştür
      const showWithDJ = {
        ...show,
        dj: show.user // user verisini dj alanına kopyala
      };
      
      return <SendMessageClient show={showWithDJ} />;
    } catch (error) {
      console.error("Error loading show:", error);
      return <div>Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</div>;
    }
  }
