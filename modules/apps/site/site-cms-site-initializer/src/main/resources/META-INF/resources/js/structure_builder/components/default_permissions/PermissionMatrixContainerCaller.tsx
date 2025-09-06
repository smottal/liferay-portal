/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React, {useState} from 'react';

import {
	IActionsType2,
	IRoleType,
	IValuesType,
} from './PermissionMatrixContainer';
import PermissionModal from './PermissionModal';

export default function PermissionMatrixContainerCaller({
	actions = {
		L_CONTENT: [
			{key: 'UPDATE', label: 'Update'},
			{key: 'VIEW', label: 'View'},
		],
		L_FILE: [
			{key: 'UPDATE', label: 'Update'},
			{key: 'VIEW', label: 'View'},
			{key: 'VIEW2', label: 'View2'},
		],
		L_FOLDER: [
			{key: 'UPDATE', label: 'Update'},
			{key: 'VIEW', label: 'View'},
			{key: 'UPDATE2', label: 'Update2'},
			{key: 'VIEW2', label: 'View2'},
			{key: 'UPDATE3', label: 'Update3'},
			{key: 'VIEW3', label: 'View3'},
		],
	},
	roles = [
		{key: 'admin', name: 'Administrator'},
		{key: 'guest', name: 'Guest'},
		{key: 'owner', name: 'Owner'},
	],
	values = {
		L_CONTENT: {admin: ['VIEW']},
		L_FILE: {admin: ['UPDATE', 'VIEW'], guest: ['VIEW'], owner: ['VIEW']},
		L_FOLDER: {admin: ['UPDATE', 'VIEW'], owner: ['VIEW']},
	},
}: {
	actions: IActionsType2;
	roles: IRoleType[];
	values?: IValuesType;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<ClayButton onClick={() => setOpen(true)}>Apri</ClayButton>

			{open && (
				<PermissionModal
					actions={actions}
					roles={roles}
					values={values}
				/>
			)}
		</>
	);
}
