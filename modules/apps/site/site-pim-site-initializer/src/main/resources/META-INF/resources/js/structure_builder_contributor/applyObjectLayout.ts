/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Field,
	GroupingContainer,
	ObjectDefinition,
	ObjectLayoutBox,
	ObjectLayoutTab,
	Structure,
	StructureChild,
	Uuid,
	buildLocalizedValue,
	getUuid,
	isField,
	sortChildren,
} from '@liferay/site-cms-site-initializer';

import {REPEATABLE_GROUP_NAME_PREFIX} from './buildObjectLayout';

export default function applyObjectLayout({
	children,
	objectDefinition,
	parent,
}: {
	children: Structure['children'];
	objectDefinition: ObjectDefinition;
	parent: Uuid;
}): Structure['children'] {
	const objectLayout = objectDefinition.objectLayouts?.find(
		(objectLayout) => objectLayout.defaultObjectLayout
	);

	if (!objectLayout) {
		return children;
	}

	const defaultLanguageId = Liferay.ThemeDisplay.getDefaultLanguageId();
	const generalName = Liferay.Language.get('general');

	const fieldsByName = new Map<string, Field>();
	const relationshipsByName = new Map<string, StructureChild>();

	for (const child of children.values()) {
		if (isField(child)) {
			fieldsByName.set(child.name, child);
		}
		else if (
			child.type === 'repeatable-group' ||
			child.type === 'referenced-structure'
		) {
			relationshipsByName.set(child.relationshipName, child);
		}
		else if (child.type === 'related-content') {
			relationshipsByName.set(child.name, child);
		}
	}

	const consumed = new Set<Uuid>();

	const takeBoxItems = (
		objectLayoutBox: ObjectLayoutBox,
		containerUuid: Uuid
	): StructureChild[] => {
		const items: StructureChild[] = [];

		const name = objectLayoutBox.name?.[defaultLanguageId] ?? '';

		if (name.startsWith(REPEATABLE_GROUP_NAME_PREFIX)) {
			const relationshipName = name.substring(
				REPEATABLE_GROUP_NAME_PREFIX.length
			);

			const node = relationshipsByName.get(relationshipName);

			if (node && !consumed.has(node.uuid)) {
				consumed.add(node.uuid);

				items.push({...node, parent: containerUuid});
			}

			return items;
		}

		for (const objectLayoutRow of objectLayoutBox.objectLayoutRows ?? []) {
			for (const objectLayoutColumn of objectLayoutRow.objectLayoutColumns ??
				[]) {
				const field = fieldsByName.get(
					objectLayoutColumn.objectFieldName
				);

				if (field && !consumed.has(field.uuid)) {
					consumed.add(field.uuid);

					items.push({...field, parent: containerUuid});
				}
			}
		}

		return items;
	};

	const buildTabChildren = (
		objectLayoutTab: ObjectLayoutTab,
		tabUuid: Uuid
	): StructureChild[] => {
		const tabChildren: StructureChild[] = [];

		for (const objectLayoutBox of objectLayoutTab.objectLayoutBoxes ?? []) {
			const name = objectLayoutBox.name?.[defaultLanguageId] ?? '';

			const isPanel =
				objectLayoutBox.collapsable &&
				!name.startsWith(REPEATABLE_GROUP_NAME_PREFIX);

			if (isPanel) {
				const panelUuid = getUuid();

				const panelChildren = takeBoxItems(objectLayoutBox, panelUuid);

				const panel: GroupingContainer = {
					children: new Map(
						panelChildren.map((child) => [child.uuid, child])
					),
					label: objectLayoutBox.name ?? buildLocalizedValue('panel'),
					parent: tabUuid,
					type: 'grouping-container',
					uuid: panelUuid,
					variant: 'panel',
				};

				tabChildren.push(panel);
			}
			else {
				tabChildren.push(...takeBoxItems(objectLayoutBox, tabUuid));
			}
		}

		return tabChildren;
	};

	const result: StructureChild[] = [];

	const objectLayoutTabs = objectLayout.objectLayoutTabs ?? [];

	for (let i = 0; i < objectLayoutTabs.length; i++) {
		const objectLayoutTab = objectLayoutTabs[i];

		const name = objectLayoutTab.name?.[defaultLanguageId] ?? '';

		if (i === 0 && name === generalName) {
			result.push(...buildTabChildren(objectLayoutTab, parent));

			continue;
		}

		const tabUuid = getUuid();

		const tabChildren = buildTabChildren(objectLayoutTab, tabUuid);

		const tab: GroupingContainer = {
			children: new Map(tabChildren.map((child) => [child.uuid, child])),
			label: objectLayoutTab.name,
			parent,
			type: 'grouping-container',
			uuid: tabUuid,
			variant: 'tab',
		};

		result.push(tab);
	}

	for (const child of children.values()) {
		if (!consumed.has(child.uuid)) {
			result.push({...child, parent});
		}
	}

	return sortChildren(new Map(result.map((child) => [child.uuid, child])));
}
