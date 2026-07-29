/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	ObjectLayout,
	ObjectLayoutBox,
	ObjectLayoutTab,
	Structure,
	StructureChild,
	buildLocalizedValue,
	isField,
} from '@liferay/site-cms-site-initializer';

export const REPEATABLE_GROUP_NAME_PREFIX = 'repeatable-group-';

export default function buildObjectLayout(
	structure: Structure
): ObjectLayout | null {
	if (!_hasGrouping(structure.children)) {
		return null;
	}

	const objectLayoutTabs: ObjectLayoutTab[] = [];

	const looseItems = Array.from(structure.children.values()).filter(
		(child) =>
			!(child.type === 'grouping-container' && child.variant === 'tab')
	);

	if (looseItems.length) {
		objectLayoutTabs.push(
			_buildTab(buildLocalizedValue('general'), looseItems)
		);
	}

	for (const child of structure.children.values()) {
		if (child.type === 'grouping-container' && child.variant === 'tab') {
			objectLayoutTabs.push(
				_buildTab(child.label, Array.from(child.children.values()))
			);
		}
	}

	return {
		defaultObjectLayout: true,
		name: structure.label,
		objectDefinitionExternalReferenceCode: structure.erc,
		objectLayoutTabs: objectLayoutTabs.map((objectLayoutTab, priority) => ({
			...objectLayoutTab,
			priority,
		})),
	};
}

function _buildFieldsBox(
	fields: Field[],
	collapsable: boolean,
	name?: Liferay.Language.LocalizedValue<string>
): ObjectLayoutBox {
	return {
		collapsable,
		...(name && {name}),
		objectLayoutRows: fields.map((field, priority) => ({
			objectLayoutColumns: [
				{objectFieldName: field.name, priority: 0, size: 12},
			],
			priority,
		})),
		type: 'regular',
	};
}

function _buildMarkerBox(relationshipName: string): ObjectLayoutBox {
	const marker = `${REPEATABLE_GROUP_NAME_PREFIX}${relationshipName}`;

	return {
		collapsable: false,
		name: {
			[Liferay.ThemeDisplay.getDefaultLanguageId()]: marker,
			[Liferay.ThemeDisplay.getLanguageId()]: marker,
		},
		objectLayoutRows: [],
		type: 'regular',
	};
}

function _buildPanelBox(panel: GroupingContainer): ObjectLayoutBox {
	const fields = Array.from(panel.children.values()).filter((child) =>
		isField(child)
	) as Field[];

	return _buildFieldsBox(fields, true, panel.label);
}

function _buildTab(
	name: Liferay.Language.LocalizedValue<string>,
	items: StructureChild[]
): ObjectLayoutTab {
	const objectLayoutBoxes: ObjectLayoutBox[] = [];

	let looseFields: Field[] = [];

	const flushLooseFields = () => {
		if (looseFields.length) {
			objectLayoutBoxes.push(_buildFieldsBox(looseFields, false));

			looseFields = [];
		}
	};

	for (const item of items) {
		if (isField(item)) {
			looseFields.push(item);
		}
		else if (
			item.type === 'grouping-container' &&
			item.variant === 'panel'
		) {
			flushLooseFields();

			objectLayoutBoxes.push(_buildPanelBox(item));

			for (const panelChild of item.children.values()) {
				objectLayoutBoxes.push(..._relationshipMarkerBoxes(panelChild));
			}
		}
		else {
			flushLooseFields();

			objectLayoutBoxes.push(..._relationshipMarkerBoxes(item));
		}
	}

	flushLooseFields();

	return {
		name,
		objectLayoutBoxes: objectLayoutBoxes.map(
			(objectLayoutBox, priority) => ({...objectLayoutBox, priority})
		),
	};
}

function _hasGrouping(children: Structure['children']): boolean {
	return Array.from(children.values()).some(
		(child) => child.type === 'grouping-container'
	);
}

function _relationshipMarkerBoxes(item: StructureChild): ObjectLayoutBox[] {
	if (
		item.type === 'repeatable-group' ||
		item.type === 'referenced-structure'
	) {
		return [_buildMarkerBox(item.relationshipName)];
	}

	if (item.type === 'related-content') {
		return [_buildMarkerBox(item.name)];
	}

	return [];
}
