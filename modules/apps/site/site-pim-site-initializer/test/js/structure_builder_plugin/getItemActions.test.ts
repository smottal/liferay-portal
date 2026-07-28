/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	RepeatableGroup,
	Structure,
	StructureChild,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import getItemActions from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/getItemActions';

const ROOT_UUID = getUuid();

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

function panel(): GroupingContainer {
	return {
		children: new Map(),
		label: {en_US: 'Panel'},
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'panel',
	};
}

function repeatableGroup(): RepeatableGroup {
	return {
		children: new Map(),
		erc: 'group-erc',
		label: {en_US: 'Group'},
		name: 'group',
		parent: ROOT_UUID,
		relationshipERC: '',
		relationshipName: '',
		type: 'repeatable-group',
		uuid: getUuid(),
	};
}

function root(...children: StructureChild[]): Structure {
	return {
		children: new Map(children.map((child) => [child.uuid, child])),
		erc: 'root-erc',
		label: {},
		name: 'Root',
		path: '',
		spaces: 'all',
		status: 'new',
		system: false,
		type: 'L_PIM_PRODUCT_TYPES',
		uuid: ROOT_UUID,
		workflows: {},
	};
}

describe('getItemActions', () => {
	it('offers create-tab and create-panel for a field', () => {
		const sku = field('sku');

		const actions = getItemActions({
			dispatch: jest.fn(),
			items: [sku],
			structure: root(sku),
		});

		expect(actions.map((action) => action.symbolLeft)).toEqual([
			'cards2',
			'container',
		]);
	});

	it('offers only create-tab for a panel (a panel cannot nest in a panel)', () => {
		const group = panel();

		const actions = getItemActions({
			dispatch: jest.fn(),
			items: [group],
			structure: root(group),
		});

		expect(actions.map((action) => action.symbolLeft)).toEqual(['cards2']);
	});

	it('offers no grouping actions for a repeatable group', () => {
		const group = repeatableGroup();

		const actions = getItemActions({
			dispatch: jest.fn(),
			items: [group],
			structure: root(group),
		});

		expect(actions).toHaveLength(0);
	});

	it('offers no create-panel when the selection mixes a field and a panel', () => {
		const sku = field('sku');
		const group = panel();

		const actions = getItemActions({
			dispatch: jest.fn(),
			items: [sku, group],
			structure: root(sku, group),
		});

		expect(actions.map((action) => action.symbolLeft)).toEqual(['cards2']);
	});

	it('dispatches add-tab when create-tab is clicked', () => {
		const dispatch = jest.fn();
		const sku = field('sku');

		const [createTab] = getItemActions({
			dispatch,
			items: [sku],
			structure: root(sku),
		});

		createTab.onClick();

		expect(dispatch).toHaveBeenCalledWith({
			parent: ROOT_UUID,
			type: 'add-grouping-container',
			uuids: [sku.uuid],
			variant: 'tab',
		});
	});

	it('dispatches add-panel when create-panel is clicked', () => {
		const dispatch = jest.fn();
		const sku = field('sku');

		const [, createPanel] = getItemActions({
			dispatch,
			items: [sku],
			structure: root(sku),
		});

		createPanel.onClick();

		expect(dispatch).toHaveBeenCalledWith({
			parent: ROOT_UUID,
			type: 'add-grouping-container',
			uuids: [sku.uuid],
			variant: 'panel',
		});
	});
});
