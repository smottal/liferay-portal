/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

/* eslint-disable no-undef */

const tabButtons = Array.prototype.slice.call(
	fragmentElement.querySelectorAll(
		'.nav-link[data-fragment-namespace="' + fragmentNamespace + '"]'
	)
);

const tabPanes = Array.prototype.slice.call(
	fragmentElement.querySelectorAll(
		'.tab-pane[data-fragment-namespace="' + fragmentNamespace + '"]'
	)
);

function activateTab(index) {
	tabButtons.forEach((tabButton, tabIndex) => {
		const active = tabIndex === index;

		tabButton.classList.toggle('active', active);
		tabButton.setAttribute('aria-selected', active ? 'true' : 'false');
	});

	tabPanes.forEach((tabPane, tabIndex) => {
		tabPane.classList.toggle('active', tabIndex === index);
	});
}

tabButtons.forEach((tabButton, index) => {
	tabButton.addEventListener('click', (event) => {
		const target = event.target;

		const editable =
			target.hasAttribute('data-lfr-editable-id') ||
			target.hasAttribute('contenteditable');

		if (editable && layoutMode === 'edit') {
			return;
		}

		activateTab(index);
	});
});
