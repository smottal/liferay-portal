/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	Structure,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import updateGroupingContainer from '../../../src/main/resources/META-INF/resources/js/structure_builder_contributor/updateGroupingContainer';

const ROOT_UUID = getUuid();
const PANEL_UUID = getUuid();

function field(name: string, parent: Uuid): Field {
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

function structureWithPanel(
	label: Liferay.Language.LocalizedValue<string>
): Structure {
	const sku = field('sku', PANEL_UUID);

	const panel: GroupingContainer = {
		children: new Map([[sku.uuid, sku]]),
		label,
		parent: ROOT_UUID,
		type: 'grouping-container',
		uuid: PANEL_UUID,
		variant: 'panel',
	};

	return {
		children: new Map([[PANEL_UUID, panel]]),
		erc: 'root-erc',
		label: {},
		name: 'Root',
		path: '',
		spaces: 'all',
		status: 'draft',
		system: false,
		type: 'L_PIM_PRODUCT_TYPES',
		uuid: ROOT_UUID,
		workflows: {},
	};
}

describe('updateGroupingContainer', () => {
	it('renames the container while preserving its fields', () => {
		const result = updateGroupingContainer({
			action: {
				label: {en_US: 'Specifications'},
				type: 'update-grouping-container',
				uuid: PANEL_UUID,
			},
			invalids: new Map(),
			structure: structureWithPanel({en_US: 'Panel'}),
		});

		const panel = result!.children.get(PANEL_UUID) as GroupingContainer;

		expect(panel.label).toEqual({en_US: 'Specifications'});
		expect(panel.children.size).toBe(1);
	});

	it('flags an empty label and clears the error once it is valid again', () => {
		const structure = structureWithPanel({en_US: 'Panel'});

		const flagged = updateGroupingContainer({
			action: {
				label: {en_US: ''},
				type: 'update-grouping-container',
				uuid: PANEL_UUID,
			},
			invalids: new Map(),
			structure,
		})!;

		expect(flagged.invalids.get(PANEL_UUID)?.get('label')).toBe('empty');

		const cleared = updateGroupingContainer({
			action: {
				label: {en_US: 'Specs'},
				type: 'update-grouping-container',
				uuid: PANEL_UUID,
			},
			invalids: flagged.invalids,
			structure,
		})!;

		expect(cleared.invalids.has(PANEL_UUID)).toBe(false);
	});

	it('returns undefined when the container no longer exists', () => {
		const result = updateGroupingContainer({
			action: {
				label: {en_US: 'X'},
				type: 'update-grouping-container',
				uuid: getUuid(),
			},
			invalids: new Map(),
			structure: structureWithPanel({en_US: 'Panel'}),
		});

		expect(result).toBeUndefined();
	});

	it('does not mutate the passed-in validation map', () => {
		const invalids = new Map();

		updateGroupingContainer({
			action: {
				label: {en_US: ''},
				type: 'update-grouping-container',
				uuid: PANEL_UUID,
			},
			invalids,
			structure: structureWithPanel({en_US: 'Panel'}),
		});

		expect(invalids.size).toBe(0);
	});
});
