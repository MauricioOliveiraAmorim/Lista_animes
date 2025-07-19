function carregarMinhaLista() {
  const lista = JSON.parse(localStorage.getItem('minhaListaAnimes')) || [];
  atualizarLista(lista);
}

function atualizarLista(animes) {
  const container = document.getElementById('animeContainer');
  container.innerHTML = '';
  animes.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
      <h3>${anime.title}</h3>
      <img src="${anime.image}" alt="${anime.title}" style="width:100%;">
      <p>${anime.synopsis || 'Sem sinopse disponível.'}</p>
      <p>Gêneros: ${anime.genres ? anime.genres.join(', ') : ''}</p>
      <p>Status: ${anime.status || ''}</p>
      <p>Nota: ${anime.score || 'N/A'}</p>
    `;
    container.appendChild(card);
  });
}

// Filtro de busca na lista pessoal
document.getElementById('buscaLista').addEventListener('input', (e) => {
  const valor = e.target.value.trim().toLowerCase();
  const lista = JSON.parse(localStorage.getItem('minhaListaAnimes')) || [];
  const filtrados = lista.filter(anime => anime.title.toLowerCase().includes(valor));
  atualizarLista(filtrados);
});

// Carregar ao abrir a página
carregarMinhaLista();