(() => {
	const active = (document.body.dataset.activeTab || '').toLowerCase();

	const items = [
		{ key: 'game', label: 'Game', href: '/' },
		{ key: 'rules', label: 'Rules', href: '/how-to-play.html' },
		{ key: 'controls', label: 'Controls', href: '/controls.html' },
		{ key: 'qa', label: 'Q&A', href: '/qa.html' },
	];

	const nav = document.createElement('nav');
	nav.className = 'bottomTabs';
	nav.setAttribute('aria-label', 'Primary navigation');

	const inner = document.createElement('div');
	inner.className = 'bottomTabs__inner';

	const row = document.createElement('div');
	row.className = 'bottomTabs__row';

	for (const item of items) {
		if (item.key === active) {
			const el = document.createElement('span');
			el.className = 'bottomTabs__tab bottomTabs__tab--active';
			el.setAttribute('aria-current', 'page');
			el.textContent = item.label;
			row.appendChild(el);
			continue;
		}

		const a = document.createElement('a');
		a.className = 'bottomTabs__tab';
		a.href = item.href;
		a.textContent = item.label;
		row.appendChild(a);
	}

	inner.appendChild(row);
	nav.appendChild(inner);

	document.body.classList.add('hasBottomTabs');
	document.body.appendChild(nav);

	// Update body padding based on actual rendered height.
	const updateHeight = () => {
		document.documentElement.style.setProperty(
			'--bottomTabsHeight',
			`${nav.getBoundingClientRect().height}px`,
		);
	};

	updateHeight();
	window.addEventListener('resize', updateHeight);
})();
