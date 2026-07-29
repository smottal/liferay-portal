/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	StructureChild,
	Uuid,
	getUuid,
} from '@liferay/site-cms-site-initializer';

import buildObjectDefinition from '../../../../site-cms-site-initializer/src/main/resources/META-INF/resources/js/structure_builder/utils/buildObjectDefinition';

function field(name: string): Field {
	return {
		erc: `${name}-erc`,
		indexableConfig: {indexed: false},
		label: {en_US: name},
		localized: false,
		locked: false,
		name,
		parent: getUuid(),
		required: false,
		settings: {},
		type: 'text',
		uuid: getUuid(),
	};
}

function toChildren(items: StructureChild[]): Map<Uuid, StructureChild> {
	return new Map(
		items.map((item): [Uuid, StructureChild] => [item.uuid, item])
	);
}

describe('buildObjectDefinition - grouping', () => {
	it('collects fields nested inside grouping-container onto the main definition', () => {
		const titleField = field('titleField');
		const emailField = field('emailField');
		const textField = field('textField');

		const nestedPanel: GroupingContainer = {
			children: toChildren([emailField]),
			label: {en_US: 'Dimensions'},
			parent: getUuid(),
			type: 'grouping-container',
			uuid: getUuid(),
			variant: 'panel',
		};

		const tab: GroupingContainer = {
			children: toChildren([nestedPanel, textField]),
			label: {en_US: 'Specs'},
			parent: getUuid(),
			type: 'grouping-container',
			uuid: getUuid(),
			variant: 'tab',
		};

		const result = buildObjectDefinition({
			children: toChildren([titleField, tab]),
			erc: 'structureERC',
			label: {en_US: 'Structure'},
			name: 'myStructure',
			spaces: [],
			status: 'draft',
		});

		expect(
			result.objectFields?.map((objectField) => objectField.name)
		).toEqual(['titleField', 'emailField', 'textField']);
	});
});
