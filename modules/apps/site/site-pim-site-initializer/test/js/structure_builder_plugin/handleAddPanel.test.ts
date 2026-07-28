/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	Structure,
	StructureChild,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';
import {openToast} from 'frontend-js-components-web';

import handleAddPanel from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/handleAddPanel';

jest.mock('frontend-js-components-web', () => ({openToast: jest.fn()}));

const ROOT_UUID = getUuid();

function field(name: string, parent: Uuid = ROOT_UUID): Field {
	return {
		erc: `${name}-erc`,
		indexableConfig: {indexed: false},
		label: {en_US: name},
		localized: false,
		locked: false,
		name,
		parent,
		required: false,
		settings: {},
		type: 'text',
		uuid: getUuid(),
	};
}

function panel(parent: Uuid = ROOT_UUID): GroupingContainer {
	return {
		children: new Map(),
		label: {en_US: 'Panel'},
		parent,
		type: 'grouping-container',
		uuid: getUuid(),
		variant: 'panel',
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

describe('handleAddPanel', () => {
	afterEach(() => {
		(openToast as jest.Mock).mockClear();
	});

	it('toasts and does not dispatch when the selection spans more than one parent', () => {
		const dispatch = jest.fn();
		const group = panel();
		const nested = field('nested', group.uuid);
		const sku = field('sku');

		group.children.set(nested.uuid, nested);

		handleAddPanel({
			dispatch,
			structure: root(sku, group),
			uuids: [sku.uuid, nested.uuid],
		});

		expect(openToast).toHaveBeenCalledWith({
			message: 'selected-items-must-be-at-the-same-hierarchy-level',
			type: 'danger',
		});
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('toasts and does not dispatch when the shared parent is a panel', () => {
		const dispatch = jest.fn();
		const group = panel();
		const sku = field('sku', group.uuid);

		group.children.set(sku.uuid, sku);

		handleAddPanel({
			dispatch,
			structure: root(group),
			uuids: [sku.uuid],
		});

		expect(openToast).toHaveBeenCalledWith({
			message: 'a-panel-cannot-be-created-inside-another-panel',
			type: 'danger',
		});
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('dispatches add-panel and does not toast for a valid selection', () => {
		const dispatch = jest.fn();
		const sku = field('sku');

		handleAddPanel({
			dispatch,
			structure: root(sku),
			uuids: [sku.uuid],
		});

		expect(dispatch).toHaveBeenCalledWith({
			parent: ROOT_UUID,
			type: 'add-grouping-container',
			uuids: [sku.uuid],
			variant: 'panel',
		});
		expect(openToast).not.toHaveBeenCalled();
	});
});
