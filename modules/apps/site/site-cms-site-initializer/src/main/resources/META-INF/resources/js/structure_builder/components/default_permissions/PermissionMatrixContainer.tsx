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

export interface IDataType {
	[key: string]: boolean;
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

	const handlePermissionsChange = useCallback(
		(data: IDataType) => {
			const temp: IActionsType = {};

			for (const [key, value] of Object.entries(data)) {
				if (!value) {
					continue;
				}

				const lastIndex = key.lastIndexOf('_');

				const roleKey = key.slice(0, lastIndex);
				const action = key.slice(lastIndex + 1);

				const existingData = temp[roleKey] || [];

				existingData.push(action);

				temp[roleKey] = existingData;
			}

			setData((prevState) => {
				return {
					...prevState,
					[tabs[activeIndex].key]: temp,
				};
			});
		},
		[activeIndex, tabs]
	);

	useEffect(() => {
		setActiveActions(actions[tabs[activeIndex].key]);
		setActiveValues((data || {})[tabs[activeIndex].key]);
	}, [actions, data, activeIndex, tabs]);

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

									setActiveIndex(index);
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
					onChange={handlePermissionsChange}
					roles={roles}
					values={activeValues}
				/>
			</div>
		</>
	);
}
