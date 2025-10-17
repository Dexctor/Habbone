import {
    getOneTopic,
    getTopicComments,
    getLikesMapForTopicComments,
    mediaUrl,
  } from '@/lib/directus';
  
  export const revalidate = 30;
  
  // gère timestamps en secondes ou millisecondes
  function fmtDateSmart(v?: string | number) {
    if (v == null) return '';
    const n = typeof v === 'string' ? Number(v) : v;
    const d = new Date(n && n < 1e12 ? n * 1000 : n);
    return isNaN(+d) ? '' : d.toLocaleString();
  }
  
  export default async function TopicPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const topicId = Number(id);
  
    const topic = await getOneTopic(topicId);
    const comments = await getTopicComments(topicId);
    const likesMap = await getLikesMapForTopicComments(
      comments.map((c: any) => Number(c.id))
    );
  
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">{topic.titulo ?? `Topic #${topic.id}`}</h1>
          <div className="text-sm opacity-60">
            {fmtDateSmart(topic.data)} {topic.fechado ? '• 🔒 fermé' : ''}{' '}
            {topic.fixo ? '• 🧷 épinglé' : ''}
          </div>
  
          {topic.imagem && (
            <img src={mediaUrl(topic.imagem)} alt="" className="rounded-lg my-3" />
          )}
  
          {topic.conteudo && (
            <div
              className="prose prose-invert max-w-none mt-3"
              dangerouslySetInnerHTML={{ __html: topic.conteudo }}
            />
          )}
        </header>
  
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Commentaires ({comments.length})
          </h2>
  
          {comments.length === 0 && (
            <div className="text-sm opacity-70">
              Aucun commentaire pour ce topic.
            </div>
          )}
  
          <ul className="space-y-3">
            {comments.map((c: any) => (
              <li key={c.id} className="border rounded p-3">
                <div className="text-xs opacity-60 mb-1">
                  {fmtDateSmart(c.data)} • 👍 {likesMap[Number(c.id)] ?? 0}
                </div>
                <div
                  className="prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: c.comentario }}
                />
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }
  