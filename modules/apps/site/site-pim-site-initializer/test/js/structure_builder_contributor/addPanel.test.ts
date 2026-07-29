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

import addPanel from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/addPanel';

const ROOT_UUID = getUuid();
const PANEL_UUID = getUuid();

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
		slug: '',
		spaces: 'all',
		status: 'new',
		system: false,
		type: 'L_PIM_PRODUCTS',
		uuid: ROOT_UUID,
		workflows: {},
	};
}

describe('addPanel', () => {
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

	it('creates a panel node labeled under both default and current language IDs', () => {
		const children = addPanel({
			panelChildren: [],
			panelParent: ROOT_UUID,
			panelUuid: PANEL_UUID,
			root: root(),
		});

		const panel = children.get(PANEL_UUID) as GroupingContainer;

		expect(panel.variant).toBe('panel');
		expect(panel.label).toEqual({en_US: 'panel', es_ES: 'panel'});
	});

	it('does not give the panel an erc or relationship (presentation only)', () => {
		const children = addPanel({
			panelChildren: [],
			panelParent: ROOT_UUID,
			panelUuid: PANEL_UUID,
			root: root(),
		});

		const panel = children.get(PANEL_UUID) as GroupingContainer;

		expect(panel).not.toHaveProperty('erc');
		expect(panel).not.toHaveProperty('relationshipERC');
		expect(panel).not.toHaveProperty('relationshipName');
	});

	it('moves the selected fields into the panel and reparents them', () => {
		const width = field('width');
		const height = field('height');

		const children = addPanel({
			panelChildren: [width, height],
			panelParent: ROOT_UUID,
			panelUuid: PANEL_UUID,
			root: root(width, height),
		});

		const panel = children.get(PANEL_UUID) as GroupingContainer;

		expect(children.has(width.uuid)).toBe(false);
		expect(children.has(height.uuid)).toBe(false);

		expect(toParents(panel)).toEqual([PANEL_UUID, PANEL_UUID]);
	});
});

function toParents(panel: GroupingContainer): string[] {
	return Array.from(panel.children.values()).map((child) => child.parent);
}
