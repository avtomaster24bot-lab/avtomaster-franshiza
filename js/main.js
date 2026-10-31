(function () {
  'use strict';
  var C = window.FRANCHISE || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var cur = C.currency || '₸';
  var money = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ' + cur; };

  // ---- город из ?city=
  var city = '';
  try { city = (new URLSearchParams(location.search).get('city') || '').trim(); } catch (e) {}
  city = city.replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').slice(0, 40);
  if (city) city = city.charAt(0).toUpperCase() + city.slice(1);

  if (city) {
    $('#heroCity').textContent = city;
    $('#leadCity').textContent = ' в городе ' + city;
    $$('.js-city-acc').forEach(function (el) { el.textContent = city; });
    $$('.js-apply-label').forEach(function (el) { el.textContent = 'Занять ' + city; });
    document.title = 'Франшиза АвтоМастер24 — ' + city;
  }

  // ---- ссылки
  var applyUrl = 'https://t.me/' + C.bot + '?text=' + encodeURIComponent((C.requestText || '') + (city || ''));
  $$('.js-apply').forEach(function (a) { a.href = applyUrl; });
  $$('.js-owner').forEach(function (a) { a.href = 'https://t.me/' + C.owner; });
  $$('.js-bot').forEach(function (a) { a.href = 'https://t.me/' + C.bot; });

  // ---- цифры
  if (!C.showFigures || !C.tiers || !C.tiers.length) {
    $$('.js-figures').forEach(function (el) { el.hidden = true; });
    $$('.js-nofigures').forEach(function (el) { el.hidden = false; });
    return;
  }
  $('#disclaimer').textContent = C.disclaimer || '';
  var fp = $('.js-faq-price');
  if (fp) fp.textContent = 'Примерно от ' + money(Math.min.apply(null, C.tiers.map(function (t) { return t.price; }))) +
    ' — зависит от размера города. Это ориентир: окончательная цена согласуется индивидуально.';

  var inList = function (list) { return city && (list || []).some(function (c) { return c.toLowerCase() === city.toLowerCase(); }); };
  var tierId = inList(C.bigCities) ? 'million' : inList(C.regionalCities) ? 'regional' : (C.tiers[1] || C.tiers[0]).id;

  var tiersEl = $('#tiers');
  C.tiers.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tier'; b.dataset.id = t.id; b.setAttribute('role', 'tab');
    b.innerHTML = '<small></small><b></b><span class="price"></span><span class="pb"></span>';
    b.querySelector('small').textContent = t.hint;
    b.querySelector('b').textContent = t.name;
    b.querySelector('.price').textContent = money(t.price);
    b.querySelector('.pb').textContent = 'окупаемость ≈ ' + t.payback;
    b.addEventListener('click', function () { select(t.id); });
    tiersEl.appendChild(b);
  });

  var terms = $('#terms');
  var ul = document.createElement('ul'); ul.className = 'checks';
  [C.royaltyNote].concat(C.extraTerms || []).forEach(function (s) { if (s) { var li = document.createElement('li'); li.textContent = s; ul.appendChild(li); } });
  terms.innerHTML = '<h3>Условия (пример)</h3>'; terms.appendChild(ul);

  var fields = ['businesses', 'fee', 'ads', 'adPrice', 'commission', 'marketing'];
  var active;
  function select(id) {
    active = C.tiers.filter(function (t) { return t.id === id; })[0] || C.tiers[0];
    $$('.tier').forEach(function (b) { var on = b.dataset.id === active.id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#calcTier').textContent = active.name.toLowerCase() + (city ? ' (' + city + ')' : '');
    fields.forEach(function (f) { $('#c_' + f).value = active.calc[f]; });
    calc();
  }
  function v(f) { return Math.max(0, parseFloat($('#c_' + f).value) || 0); }
  function calc() {
    var place = v('businesses') * v('fee'), ads = v('ads') * v('adPrice'), com = v('commission');
    var gross = place + ads + com, roy = gross * (C.royaltyPercent || 0) / 100, mk = v('marketing');
    var net = gross - roy - mk;
    var pb = net > 0 ? Math.ceil(active.price / net) : null;
    var rows = [
      ['Размещение: ' + v('businesses') + ' × ' + money(v('fee')), money(place)],
      ['Реклама: ' + v('ads') + ' × ' + money(v('adPrice')), money(ads)],
      ['Доля комиссии с заказов', money(com)],
      ['Выручка в месяц', money(gross), 'sum'],
      ['− Роялти ' + (C.royaltyPercent || 0) + '%', '−' + money(roy)],
      ['− Продвижение', '−' + money(mk)],
      ['Чистыми в месяц (пример)', money(net), 'net'],
      ['Окупаемость взноса ' + money(active.price), pb ? '≈ ' + pb + ' мес.' : '—', 'net']
    ];
    var tb = $('#calcRes'); tb.innerHTML = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr'); if (r[2]) tr.className = r[2];
      var a = document.createElement('td'); a.textContent = r[0];
      var b = document.createElement('td'); b.textContent = r[1];
      tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr);
    });
  }
  fields.forEach(function (f) { $('#c_' + f).addEventListener('input', calc); });
  select(tierId);
})();
