let pagina = 1;
const animeContainer = document.getElementById('animeContainer');
const paginaAtual = document.getElementById('paginaAtual');
const buscaInput = document.getElementById('buscaAnimes');
const filtroGenero = document.getElementById('filtroGenero');
const filtroAno = document.getElementById('filtroAno');
const generosBloqueados = ["Hentai", "Erotica", "Adult"];
const animesPorPagina = 9;
let debounceTimer;

// Gêneros fixos
const generos = [
  { id: 1, nome: "Ação" }, { id: 2, nome: "Aventura" }, { id: 4, nome: "Comédia" },
  { id: 8, nome: "Drama" }, { id: 10, nome: "Fantasia" }, { id: 22, nome: "Romance" },
  { id: 24, nome: "Sci-Fi" }, { id: 14, nome: "Horror" }, { id: 7, nome: "Mistério" }
];
generos.forEach(g => {
  const opt = document.createElement('option');
  opt.value = g.id;
  opt.textContent = g.nome;
  filtroGenero.appendChild(opt);
});

// Preenche o select de anos (1970 até o ano atual)
const anoAtual = new Date().getFullYear();
for (let ano = anoAtual; ano >= 1970; ano--) {
  const opt = document.createElement('option');
  opt.value = ano;
  opt.textContent = ano;
  filtroAno.appendChild(opt);
}

async function buscarAnimes() {
  animeContainer.innerHTML = '<p>Carregando...</p>';
  const termoBusca = buscaInput.value.trim().toLowerCase();
  const genero = filtroGenero.value;
  const ano = filtroAno.value;

  let animes = [];

  if (ano) {
    // Busca por todas as temporadas do ano selecionado
    const estacoes = ['winter', 'spring', 'summer', 'fall'];
    for (const estacao of estacoes) {
      const url = `https://api.jikan.moe/v4/seasons/${ano}/${estacao}`;
      try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.data) {
          animes = animes.concat(data.data);
        }
      } catch (e) {
        // Se alguma estação falhar, apenas ignora
      }
    }
    // Remove duplicados por mal_id
    const vistos = new Set();
    animes = animes.filter(anime => {
      if (vistos.has(anime.mal_id)) return false;
      vistos.add(anime.mal_id);
      return true;
    });
  } else {
    // Busca padrão por página
    let animesUnicos = [];
    let titulosUnicos = new Set();
    let apiPage = pagina;
    let tentativas = 0;
    while (animesUnicos.length < animesPorPagina && tentativas < 10) {
      let url = `https://api.jikan.moe/v4/anime?status=airing&order_by=start_date&sort=desc&page=${apiPage}&limit=10`;
      if (termoBusca) url += `&q=${encodeURIComponent(termoBusca)}`;
      if (genero) url += `&genres=${genero}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.data || data.data.length === 0) break;
      data.data
        .filter(anime => !anime.genres.some(g => generosBloqueados.includes(g.name)))
        .forEach(anime => {
          if (!titulosUnicos.has(anime.title) && animesUnicos.length < animesPorPagina) {
            titulosUnicos.add(anime.title);
            animesUnicos.push(anime);
          }
        });
      apiPage++;
      tentativas++;
    }
    animes = animesUnicos;
  }

  // Filtros finais (gênero, busca por texto)
  animes = animes
    .filter(anime => !anime.genres.some(g => generosBloqueados.includes(g.name)))
    .filter(anime => {
      if (genero && !anime.genres.some(g => g.id == genero)) return false;
      if (termoBusca && !anime.title.toLowerCase().includes(termoBusca)) return false;
      return true;
    });

  // Paginação manual para busca por ano
  let animesPagina = animes;
  if (ano) {
    const start = (pagina - 1) * animesPorPagina;
    animesPagina = animes.slice(start, start + animesPorPagina);
  }

  animeContainer.innerHTML = '';
  if (animesPagina.length === 0) {
    animeContainer.innerHTML = '<p style="color:white;text-align:center;">Não há mais animes únicos para exibir nesta busca.</p>';
  }
  animesPagina.forEach(anime => {
    const card = document.createElement('div');
    card.className = 'anime-card flex-card';
    const anoAired = anime.aired && anime.aired.from ? anime.aired.from.substring(0, 4) : '';
    card.innerHTML = `
      <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="anime-img">
      <div class="anime-info">
        <h3>${anime.title}</h3>
        <p>Gêneros: ${anime.genres.map(g => g.name).join(', ')}</p>
        <p style="font-size:0.95em;color:#aaa;">Ano: ${anoAired}</p>
        <button class="adicionar-btn">Adicionar à lista</button>
      </div>
    `;
    card.querySelector('.adicionar-btn').onclick = () => abrirPopupAdicionar(anime);
    animeContainer.appendChild(card);
  });
}

// Paginação
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

// Debounce na busca
buscaInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  pagina = 1;
  paginaAtual.textContent = pagina;
  debounceTimer = setTimeout(buscarAnimes, 400);
});

// Enter faz busca imediata
buscaInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer);
    pagina = 1;
    paginaAtual.textContent = pagina;
    buscarAnimes();
  }
});

// Filtro de gênero
filtroGenero.addEventListener('change', () => {
  pagina = 1;
  paginaAtual.textContent = pagina;
  buscarAnimes();
});

// Filtro de ano
filtroAno.addEventListener('change', () => {
  pagina = 1;
  paginaAtual.textContent = pagina;
  buscarAnimes();
});

// Inicial
buscarAnimes();


// ========== POPUP DE ADICIONAR ANIME ==========

let animeSelecionado = null;

// Função para abrir o popup
function abrirPopupAdicionar(anime) {
  animeSelecionado = anime;
  document.getElementById('popupAnimeImg').src = anime.images.jpg.image_url;
  document.getElementById('popupAnimeTitulo').textContent = anime.title;
  document.getElementById('popupAnimeGenero').textContent = "Gêneros: " + anime.genres.map(g => g.name).join(', ');
  document.getElementById('popupAnimeDescricao').textContent = anime.synopsis || "Sem descrição.";
  document.getElementById('notaAnime').value = 0;
  atualizarEstrelas(0);
  document.getElementById('popupAdicionar').style.display = 'flex';
  ativarAba('normal');
}

// Fechar popup
document.getElementById('fecharPopup').onclick = () => {
  document.getElementById('popupAdicionar').style.display = 'none';
};

// Troca de abas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ativarAba(btn.dataset.tab);
  };
});
function ativarAba(tab) {
  document.getElementById('tab-normal').style.display = tab === 'normal' ? 'block' : 'none';
  document.getElementById('tab-detalhada').style.display = tab === 'detalhada' ? 'block' : 'none';
}

// Atualiza estrelas conforme nota
document.getElementById('notaAnime').addEventListener('input', e => {
  let nota = parseFloat(e.target.value.replace(',', '.'));
  if (isNaN(nota) || nota < 0) nota = 0;
  if (nota > 10) nota = 10;
  atualizarEstrelas(nota);
});
function atualizarEstrelas(nota) {
  const estrelasDiv = document.getElementById('estrelasNota');
  estrelasDiv.innerHTML = '';
  const estrelas = 5;
  const notaEstrelas = Math.max(0, Math.min(5, nota / 2)); // 0 a 5

  for (let i = 0; i < estrelas; i++) {
    let proporcao = Math.min(1, Math.max(0, notaEstrelas - i)); // 0 a 1 para cada estrela
    // SVG com preenchimento proporcional
    estrelasDiv.innerHTML += `
      <svg width="32" height="32" viewBox="0 0 24 24" style="vertical-align:middle;">
        <defs>
          <linearGradient id="grad${i}">
            <stop offset="${proporcao * 100}%" stop-color="#FFD700"/>
            <stop offset="${proporcao * 100}%" stop-color="#333"/>
          </linearGradient>
        </defs>
        <polygon points="12,2 15,9 22,9.3 17,14.1 18.5,21 12,17.5 5.5,21 7,14.1 2,9.3 9,9"
          fill="url(#grad${i})" stroke="#FFD700" stroke-width="1"/>
      </svg>
    `;
  }
}

// Adicionar à lista com nota
document.getElementById('confirmarAdicionar').onclick = () => {
  if (!animeSelecionado) return;
  const nota = parseFloat(document.getElementById('notaAnime').value.replace(',', '.')) || 0;
  const lista = JSON.parse(localStorage.getItem('minhaListaAnimes')) || [];
  if (!lista.some(a => a.mal_id === animeSelecionado.mal_id)) {
    lista.push({
      mal_id: animeSelecionado.mal_id,
      title: animeSelecionado.title,
      image: animeSelecionado.images.jpg.image_url,
      genres: animeSelecionado.genres.map(g => g.name),
      synopsis: animeSelecionado.synopsis,
      status: animeSelecionado.status,
      score: animeSelecionado.score,
      nota: nota
    });
    localStorage.setItem('minhaListaAnimes', JSON.stringify(lista));
    alert('Anime adicionado à sua lista!');
    document.getElementById('popupAdicionar').style.display = 'none';
  } else {
    alert('Esse anime já está na sua lista.');
  }
}