/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayModal, {useModal} from '@clayui/modal';
import {sub} from 'frontend-js-web';
import React from 'react';

import PermissionMatrixContainer, {
	IActionsType,
	IRoleType,
	IValuesType,
} from './PermissionMatrixContainer';

export default function PermissionModal({
	actions,
	roles,
	values,
}: {
	actions: IActionsType;
	roles: IRoleType[];
	values?: IValuesType;
}) {
	const closeHandler = () => {
		console.error('close');
	}

	const saveHandler = () => {
		console.error('save');
	};

	return (
		<>
			<ClayModal.Header>
				{sub(
					Liferay.Language.get('edit-x'),
					Liferay.Language.get('default-permissions')
				)}
			</ClayModal.Header>

			<ClayModal.Body className="p-0">
				<PermissionMatrixContainer
					actions={actions}
					roles={roles}
					values={values}
				/>
			</ClayModal.Body>

			<ClayModal.Footer
				last={
					<ClayButton.Group spaced>
						<ClayButton displayType="secondary" onClick={closeHandler}>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton onClick={saveHandler}>
							{Liferay.Language.get('save')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</>
	);
}
