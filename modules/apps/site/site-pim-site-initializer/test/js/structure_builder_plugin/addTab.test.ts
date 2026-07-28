/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	Structure,
	getUuid,
	setDefaultLanguageLabels,
} from '@liferay/site-cms-site-initializer';

import addTab from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/addTab';

const ROOT_UUID = getUuid();
const TAB_UUID = getUuid();

function field(name: string): Field {
	return {
		erc: `${name}-erc`,
		indexableConfig: {indexed: false},
		label: {en_US: name},
		localized: false,
		locked: false,
		name,
		parent: ROOT_UUID,
		required: false,
		settings: {},
		type: 'text',
		uuid: getUuid(),
	};
}

function root(...fields: Field[]): Structure {
	return {
		children: new Map(fields.map((child) => [child.uuid, child])),
		erc: 'root-erc',
		label: {},
		name: 'Root',
		path: '',
		spaces: 'all',
		status: 'new',
		system: false,
		type: 'L_PIM_PRODUCTS',
		uuid: ROOT_UUID,
		workflows: {},
	};
}

describe('addTab', () => {
	beforeEach(() => {
		jest.spyOn(
			Liferay.ThemeDisplay,
			'getDefaultLanguageId'
		).mockReturnValue('en_US');
		jest.spyOn(Liferay.ThemeDisplay, 'getLanguageId').mockReturnValue(
			'es_ES'
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		setDefaultLanguageLabels({labels: {}, locale: 'en_US'});
	});

	it('creates a tab node labeled under both default and current language IDs', () => {
		const children = addTab({
			root: root(),
			tabChildren: [],
			tabParent: ROOT_UUID,
			tabUuid: TAB_UUID,
		});

		const tab = children.get(TAB_UUID) as GroupingContainer;

		expect(tab.variant).toBe('tab');
		expect(tab.label).toEqual({en_US: 'tab', es_ES: 'tab'});
	});

	it('does not give the tab an erc or relationship (presentation only)', () => {
		const children = addTab({
			root: root(),
			tabChildren: [],
			tabParent: ROOT_UUID,
			tabUuid: TAB_UUID,
		});

		const tab = children.get(TAB_UUID) as GroupingContainer;

		expect(tab).not.toHaveProperty('erc');
		expect(tab).not.toHaveProperty('relationshipERC');
		expect(tab).not.toHaveProperty('relationshipName');
	});

	it('moves the selected fields into the tab and reparents them', () => {
		const title = field('title');
		const sku = field('sku');

		const children = addTab({
			root: root(title, sku),
			tabChildren: [sku],
			tabParent: ROOT_UUID,
			tabUuid: TAB_UUID,
		});

		const tab = children.get(TAB_UUID) as GroupingContainer;

		expect(children.has(title.uuid)).toBe(true);
		expect(children.has(sku.uuid)).toBe(false);

		const movedField = tab.children.get(sku.uuid) as Field;

		expect(movedField.name).toBe('sku');
		expect(movedField.parent).toBe(TAB_UUID);
	});
});
