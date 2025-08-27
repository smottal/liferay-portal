/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import React, {useState} from 'react';

import {
	IActionsType,
	IRoleType,
	IValuesType,
} from './PermissionMatrixContainer';
import PermissionModal from './PermissionModal';

export default function PermissionMatrixContainerCaller({
	actions = {
		L_CONTENT: ['UPDATE', 'VIEW'],
		L_FILE: ['UPDATE', 'VIEW', 'VIEW2'],
		L_FOLDER: ['UPDATE', 'VIEW', 'UPDATE2', 'VIEW2', 'UPDATE3', 'VIEW3'],
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
	actions: IActionsType;
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
					onCloseModal={() => setOpen(false)}
					roles={roles}
					values={values}
				/>
			)}
		</>
	);
}
