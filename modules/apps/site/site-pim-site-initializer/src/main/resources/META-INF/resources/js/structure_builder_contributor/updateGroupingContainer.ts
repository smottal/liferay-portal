/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	ErrorMap,
	GroupingContainer,
	Structure,
	UpdateGroupingContainerAction,
	Uuid,
	findChild,
	updateChild,
	validateRepeatableGroup,
} from '@liferay/site-cms-site-initializer';

export default function updateGroupingContainer({
	action,
	invalids,
	structure,
}: {
	action: UpdateGroupingContainerAction;
	invalids: Map<Uuid, ErrorMap>;
	structure: Structure;
}):
	| {children: Structure['children']; invalids: Map<Uuid, ErrorMap>}
	| undefined {
	const {label, uuid} = action;

	const container = findChild({root: structure, uuid}) as GroupingContainer;

	if (!container) {
		return undefined;
	}

	const children = updateChild({
		child: {...container, label},
		root: structure,
	});

	const invalidsPatch = new Map(invalids);

	const errors = validateRepeatableGroup({
		currentErrors: invalids.get(uuid),
		data: {label},
	});

	if (errors.size) {
		invalidsPatch.set(uuid, errors);
	}
	else {
		invalidsPatch.delete(uuid);
	}

	return {children, invalids: invalidsPatch};
}
