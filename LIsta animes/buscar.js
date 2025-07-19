let pagina = 1;
let termoBusca = '';
const animeContainer = document.getElementById('animeContainer');
const paginaAtual = document.getElementById('paginaAtual');
const buscaInput = document.getElementById('buscaAnimes');
const generosBloqueados = ["Hentai", "Erotica", "Adult"];

// Gêneros fixos (pode ser dinâmico via API se quiser)
const generos = [
  { id: 1, nome: "Ação" }, { id: 2, nome: "Aventura" }, { id: 4, nome: "Comédia" },
  { id: 8, nome: "Drama" }, { id: 10, nome: "Fantasia" }, { id: 22, nome: "Romance" },
  { id: 24, nome: "Sci-Fi" }, { id: 14, nome: "Horror" }, { id: 7, nome: "Mistério" }
  // ...adicione mais se quiser
];
const selectGenero = document.getElementById('filtroGenero');
generos.forEach(g => {
  const opt = document.createElement('option');
  opt.value = g.id;
  opt.textContent = g.nome;
  selectGenero.appendChild(opt);
});

// Anos (exemplo: 2010 até o ano atual)
const selectAno = document.getElementById('filtroAno');
const anoAtual = new Date().getFullYear();
for (let ano = anoAtual; ano >= 1970; ano--) {
  const opt = document.createElement('option');
  opt.value = ano;
  opt.textContent = ano;
  selectAno.appendChild(opt);
}

async function buscarAnimes() {
  animeContainer.innerHTML = '<p>Carregando...</p>';
  let url = `https://api.jikan.moe/v4/anime?status=airing&order_by=start_date&sort=desc&page=${pagina}&limit=10`;

  const genero = document.getElementById('filtroGenero').value;
  const ano = document.getElementById('filtroAno').value;

if (termoBusca) url += `&q=${encodeURIComponent(termoBusca)}`;
if (genero) url += `&genres=${genero}`;
if (ano) url += `&start_date=${ano}`;
if (termoBusca) {
  url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(termoBusca)}&status=airing&order_by=start_date&sort=desc&page=${pagina}&limit=10`;
}
const response = await fetch(url);
  const data = await response.json();
  animeContainer.innerHTML = '';
const titulosExibidos = new Set();
data.data
  .filter(anime => !anime.genres.some(g => generosBloqueados.includes(g.name)))
  .filter(anime => {
    if (titulosExibidos.has(anime.title)) return false;
    titulosExibidos.add(anime.title);
    return true;
  })
    .forEach(anime => {
      const card = document.createElement('div');
      card.className = 'anime-card flex-card';
      card.innerHTML = `
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="anime-img">
        <div class="anime-info">
          <h3>${anime.title}</h3>
          <p>Gêneros: ${anime.genres.map(g => g.name).join(', ')}</p>
          <button class="adicionar-btn">Adicionar à lista</button>
        </div>
      `;
      card.querySelector('.adicionar-btn').onclick = () => adicionarAnime(anime);
      animeContainer.appendChild(card);
    });
}

function adicionarAnime(anime) {
  const lista = JSON.parse(localStorage.getItem('minhaListaAnimes')) || [];
  if (!lista.some(a => a.mal_id === anime.mal_id)) {
    lista.push({
      mal_id: anime.mal_id,
      title: anime.title,
      image: anime.images.jpg.image_url,
      genres: anime.genres.map(g => g.name),
      synopsis: anime.synopsis,
      status: anime.status,
      score: anime.score
    });
    localStorage.setItem('minhaListaAnimes', JSON.stringify(lista));
    alert('Anime adicionado à sua lista!');
  } else {
    alert('Esse anime já está na sua lista.');
  }
}

document.getElementById('prevBtn').onclick = () => {
  if (pagina > 1) {
    pagina--;
    paginaAtual.textContent = pagina;
    buscarAnimes();
  }
};

document.getElementById('nextBtn').onclick = () => {
  pagina++;
  paginaAtual.textContent = pagina;
  buscarAnimes();
};

buscaInput.addEventListener('input', (e) => {
  termoBusca = e.target.value.trim();
  pagina = 1;
  paginaAtual.textContent = pagina;
  buscarAnimes();
});

buscarAnimes();

let debounceTimer;
buscaInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  termoBusca = e.target.value.trim();
  pagina = 1;
  paginaAtual.textContent = pagina;
  debounceTimer = setTimeout(buscarAnimes, 400); // só busca após 400ms sem digitar
});

document.getElementById('filtroGenero').addEventListener('change', () => {
  pagina = 1;
  paginaAtual.textContent = pagina;
  buscarAnimes();
});
document.getElementById('filtroAno').addEventListener('change', () => {
  pagina = 1;
  paginaAtual.textContent = pagina;
  buscarAnimes();
});