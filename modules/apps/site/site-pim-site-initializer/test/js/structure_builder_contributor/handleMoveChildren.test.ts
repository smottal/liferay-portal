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
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';
import {openToast} from 'frontend-js-components-web';

import structureBuilderRegistry from '../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/structure_builder/contributors/registry';
import handleMoveChildren from '../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/structure_builder/utils/handleMoveChildren';

jest.mock('frontend-js-components-web', () => ({openToast: jest.fn()}));

const STRUCTURE_UUID = getUuid();
const LOCKED_FIELD_UUID = getUuid();
const TAB_UUID = getUuid();
const GROUP_UUID = getUuid();

function lockedField(): Field {
	return {
		erc: 'title-erc',
		indexableConfig: {indexed: false},
		label: {en_US: 'Title'},
		localized: false,
		locked: true,
		name: 'title',
		parent: STRUCTURE_UUID,
		required: true,
		settings: {},
		type: 'text',
		uuid: LOCKED_FIELD_UUID,
	};
}

function tab(): GroupingContainer {
	return {
		children: new Map(),
		label: {en_US: 'Details'},
		parent: STRUCTURE_UUID,
		type: 'grouping-container',
		uuid: TAB_UUID,
		variant: 'tab',
	};
}

function repeatableGroup(): RepeatableGroup {
	return {
		children: new Map(),
		erc: 'group-erc',
		label: {en_US: 'Group'},
		name: 'group',
		parent: STRUCTURE_UUID,
		relationshipERC: 'group-rel-erc',
		relationshipName: 'group',
		type: 'repeatable-group',
		uuid: GROUP_UUID,
	};
}

function structure(children: StructureChild[]): Structure {
	return {
		children: new Map(children.map((child) => [child.uuid, child])),
		erc: 'structure-erc',
		label: {en_US: 'Structure'},
		name: 'Structure',
		path: '',
		slug: '',
		spaces: 'all',
		status: 'draft',
		system: false,
		type: 'L_CUSTOM_STRUCTURES',
		uuid: STRUCTURE_UUID,
		workflows: {},
	};
}

const EMPTY_HISTORY = {
	deletedChildren: [],
	deletedGroupERCs: [],
	deletedRelationships: [],
	modifiedNames: new Set<Uuid>(),
	modifiedSlugs: new Set<Uuid>(),
};

describe('handleMoveChildren - contributor delegation', () => {
	beforeAll(() => {
		structureBuilderRegistry.addProvider({
			id: 'stub',
			isGroupingContainer: (child) => child.type === 'grouping-container',
			supports: () => true,
		});
	});

	beforeEach(() => {
		(openToast as jest.Mock).mockClear();
	});

	it('moves a system (locked) field into a tab (layout only) without warning', async () => {
		const dispatch = jest.fn();

		await handleMoveChildren({
			deletedChildren: EMPTY_HISTORY.deletedChildren,
			dispatch,
			publishedChildren: new Set(),
			structure: structure([lockedField(), tab()]),
			targetUuid: TAB_UUID,
			uuids: [LOCKED_FIELD_UUID],
		});

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				items: [
					expect.objectContaining({
						parent: TAB_UUID,
						uuid: LOCKED_FIELD_UUID,
					}),
				],
				targetUuid: TAB_UUID,
				type: 'move-children',
			})
		);
		expect(openToast).not.toHaveBeenCalled();
	});

	it('does not move a system (locked) field into a repeatable group', async () => {
		const dispatch = jest.fn();

		await handleMoveChildren({
			deletedChildren: EMPTY_HISTORY.deletedChildren,
			dispatch,
			publishedChildren: new Set(),
			structure: structure([lockedField(), repeatableGroup()]),
			targetUuid: GROUP_UUID,
			uuids: [LOCKED_FIELD_UUID],
		});

		expect(dispatch).not.toHaveBeenCalledWith(
			expect.objectContaining({type: 'move-children'})
		);
		expect(openToast).toHaveBeenCalled();
	});
});
