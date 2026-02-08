/**
 * Client-side search powered by Lunr.js.
 * Fetches a pre-built search-index.json and provides instant full-text search
 * with stemming, relevance ranking, and field boosting.
 */
(function () {
  'use strict';

  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  let lunrIndex = null;
  let postsMap = {};
  let debounceTimer = null;

  function showLoading() {
    resultsContainer.innerHTML =
      '<p class="text-center text-gray-500 py-8">Loading search index...</p>';
  }

  function showEmpty() {
    resultsContainer.innerHTML = `
      <div class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Search for posts</h3>
        <p class="text-gray-500">Enter a search term to find posts.</p>
      </div>`;
  }

  function showNoResults(query) {
    resultsContainer.innerHTML = `
      <div class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p class="text-gray-500">Try different keywords or check your spelling.</p>
      </div>`;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function renderResults(results, query) {
    if (!results.length) {
      showNoResults(query);
      return;
    }

    var countLabel = results.length === 1 ? 'result' : 'results';
    var html = '<p class="text-gray-600 mb-6">Found ' + results.length + ' ' + countLabel +
      ' for "' + escapeHtml(query) + '"</p><div class="space-y-6">';

    results.forEach(function (result) {
      var post = postsMap[result.ref];
      if (!post) return;
      html += `
        <article class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="flex items-center text-sm text-gray-500 mb-2">
            <span>${escapeHtml(post.date || '')}</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">
            <a href="/post/${encodeURIComponent(post.slug)}/" class="hover:text-primary transition">
              ${escapeHtml(post.title)}
            </a>
          </h2>
          ${post.excerpt ? '<p class="text-gray-600">' + escapeHtml(post.excerpt) + '</p>' : ''}
        </article>`;
    });

    html += '</div>';
    resultsContainer.innerHTML = html;
  }

  function performSearch(query) {
    query = query.trim();
    // Update URL without reload
    var url = new URL(window.location);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    history.replaceState(null, '', url);

    if (!query) {
      showEmpty();
      return;
    }

    if (!lunrIndex) {
      showLoading();
      return;
    }

    try {
      var results = lunrIndex.search(query);
      renderResults(results, query);
    } catch (e) {
      // Lunr throws on syntax errors in query; fall back to wildcard
      try {
        var results = lunrIndex.search(query + '*');
        renderResults(results, query);
      } catch (e2) {
        showNoResults(query);
      }
    }
  }

  function buildIndex(posts) {
    postsMap = {};
    posts.forEach(function (post) {
      postsMap[post.slug] = post;
    });

    lunrIndex = lunr(function () {
      this.ref('slug');
      this.field('title', { boost: 10 });
      this.field('excerpt', { boost: 5 });
      this.field('content', { boost: 1 });

      posts.forEach(function (post) {
        this.add(post);
      }, this);
    });
  }

  function init() {
    if (!input || !resultsContainer) return;

    showLoading();

    // Use relative path so it works on file:// and subdirectory deployments
    var basePath = '../search-index.json';

    fetch(basePath)
      .then(function (resp) {
        if (!resp.ok) throw new Error('Failed to load search index');
        return resp.json();
      })
      .then(function (posts) {
        buildIndex(posts);

        // Run initial search from URL query param
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q') || '';
        input.value = q;
        performSearch(q);
      })
      .catch(function () {
        resultsContainer.innerHTML =
          '<p class="text-center text-red-500 py-8">Could not load search index.</p>';
      });

    // Live search with debounce
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(input.value);
      }, 200);
    });

    // Prevent form submission (search is handled client-side)
    var form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        performSearch(input.value);
      });
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
