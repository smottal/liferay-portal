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

export default function addPanel({
	panelChildren,
	panelParent,
	panelUuid,
	root,
}: {
	panelChildren: StructureChild[];
	panelParent: Uuid;
	panelUuid: Uuid;
	root: Structure | Container;
}): Structure['children'] | Container['children'] {
	const children = new Map();

	for (const child of root.children.values()) {
		if (panelChildren.some(({uuid}) => uuid === child.uuid)) {
			continue;
		}

		if (isContainer(child)) {
			const container = {
				...child,
				children: addPanel({
					panelChildren,
					panelParent,
					panelUuid,
					root: child,
				}),
			};

			children.set(container.uuid, container);
		}
		else {
			children.set(child.uuid, child);
		}
	}

	if (root.uuid === panelParent) {
		const panel: GroupingContainer = {
			children: new Map(
				panelChildren.map((child) => [
					child.uuid,
					{...child, parent: panelUuid},
				])
			),
			label: buildLocalizedValue('panel'),
			parent: panelParent,
			type: 'grouping-container',
			uuid: panelUuid,
			variant: 'panel',
		};

		children.set(panel.uuid, panel);
	}

	return sortChildren(children);
}
