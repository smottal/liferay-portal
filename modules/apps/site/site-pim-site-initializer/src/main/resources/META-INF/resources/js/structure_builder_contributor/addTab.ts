/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	Container,
	GroupingContainer,
	Structure,
	StructureChild,
	Uuid,
	buildLocalizedValue,
	isContainer,
	sortChildren,
} from '@liferay/site-cms-site-initializer';

export default function addTab({
	root,
	tabChildren,
	tabParent,
	tabUuid,
}: {
	root: Structure | Container;
	tabChildren: StructureChild[];
	tabParent: Uuid;
	tabUuid: Uuid;
}): Structure['children'] | Container['children'] {
	const children = new Map();

	for (const child of root.children.values()) {
		if (tabChildren.some(({uuid}) => uuid === child.uuid)) {
			continue;
		}

		if (isContainer(child)) {
			const container = {
				...child,
				children: addTab({
					root: child,
					tabChildren,
					tabParent,
					tabUuid,
				}),
			};

			children.set(container.uuid, container);
		}
		else {
			children.set(child.uuid, child);
		}
	}

	if (root.uuid === tabParent) {
		const tab: GroupingContainer = {
			children: new Map(
				tabChildren.map((child) => [
					child.uuid,
					{...child, parent: tabUuid},
				])
			),
			label: buildLocalizedValue('tab'),
			parent: tabParent,
			type: 'grouping-container',
			uuid: tabUuid,
			variant: 'tab',
		};

		children.set(tab.uuid, tab);
	}

	return sortChildren(children);
}
