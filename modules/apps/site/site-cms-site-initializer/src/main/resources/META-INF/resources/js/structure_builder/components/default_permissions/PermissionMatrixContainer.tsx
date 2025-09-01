/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayTabs from '@clayui/tabs';
import React, {useCallback, useEffect, useState} from 'react';

import PermissionMatrix from './PermissionMatrix';

export interface IActionsType {
	[key: string]: string[];
}

export interface IRoleType {
	key: string;
	name: string;
}

export interface IValuesType {
	[key: string]: IActionsType;
}

export default function PermissionMatrixContainer({
	actions,
	roles,
	values,
}: {
	actions: IActionsType;
	roles: IRoleType[];
	values?: IValuesType;
}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [activeActions, setActiveActions] = useState<string[]>([]);
	const [activeValues, setActiveValues] = useState({});
	const [data, setData] = useState<IValuesType>(values || {});
	const [tabs, setTabs] = useState([
		{key: 'L_FOLDER', label: 'folder'},
		{key: 'L_CONTENT', label: 'content'},
		{key: 'L_FILE', label: 'file'},
	]);

	const handleTabChange = useCallback(
		(index: number) => {
			setActiveIndex(index);

			setActiveActions(actions[tabs[index].key]);
			setActiveValues((values || {})[tabs[index].key]);
		},
		[actions, tabs, values]
	);

	useEffect(() => {
		handleTabChange(0);
	}, [handleTabChange]);

	useEffect(() => {
		setData(values || {});
	}, [values]);

	return (
		<>
			<ClayTabs
				active={activeIndex}
				defaultActive={0}
				onActiveChange={handleTabChange}
			>
				{tabs.map((tab) => {
					return (
						<ClayTabs.Item
							data-testid={`tab-${tab.key}`}
							key={`tab-${tab.key}`}
						>
							{Liferay.Language.get(tab.label)}
						</ClayTabs.Item>
					);
				})}
			</ClayTabs>
			<ClayTabs.Content fade={false}>
				<ClayTabs.TabPane active={true}>
					<PermissionMatrix
						actions={activeActions}
						roles={roles}
						values={activeValues}
					/>
				</ClayTabs.TabPane>
			</ClayTabs.Content>
		</>
	);
}
