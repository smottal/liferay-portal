/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayLink from '@clayui/link';
import ClayNavigationBar from '@clayui/navigation-bar';
import React, {useCallback, useEffect, useState} from 'react';

import PermissionMatrix from './PermissionMatrix';

export interface IActionsType {
	[key: string]: string[];
}

export interface IRoleType {
	key: string;
	name: string;
}

export interface ITypeType {
	key: string;
	label: string;
}

export interface IValuesType {
	[key: string]: IActionsType;
}

const DEFAULT_TYPES = [
	{key: 'L_FOLDER', label: 'folder'},
	{key: 'L_CONTENT', label: 'content'},
	{key: 'L_FILE', label: 'file'},
];

export default function PermissionMatrixContainer({
	actions,
	roles,
	types,
	values,
}: {
	actions: IActionsType;
	roles: IRoleType[];
	types?: ITypeType[];
	values?: IValuesType;
}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [activeActions, setActiveActions] = useState<string[]>([]);
	const [activeValues, setActiveValues] = useState({});
	const [data, setData] = useState<IValuesType>(values || {});
	const [tabs, setTabs] = useState<ITypeType[]>(DEFAULT_TYPES);

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
		setTabs(types || DEFAULT_TYPES);
	}, [types]);

	useEffect(() => {
		setData(values || {});
	}, [values]);

	return (
		<>
			<ClayNavigationBar triggerLabel={String(activeIndex)}>
				{tabs.map((tab, index) => {
					return (
						<ClayNavigationBar.Item
							active={index === activeIndex}
							key={`tab-${tab.key}`}
						>
							<ClayLink
								data-testid={`tab-${tab.key}`}
								onClick={(event) => {
									event.preventDefault();

									handleTabChange(index);
								}}
								role="tab"
							>
								{Liferay.Language.get(tab.label)}
							</ClayLink>
						</ClayNavigationBar.Item>
					);
				})}
			</ClayNavigationBar>

			<div className="border-bottom">
				<PermissionMatrix
					actions={activeActions}
					roles={roles}
					values={activeValues}
				/>
			</div>
		</>
	);
}
