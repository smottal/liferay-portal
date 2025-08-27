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
	onCloseModal,
	roles,
	values,
}: {
	actions: IActionsType;
	onCloseModal?: () => void;
	roles: IRoleType[];
	values?: IValuesType;
}) {
	const {observer, onClose} = useModal({
		onClose: () => {
			if (onCloseModal) {
				onCloseModal();
			}
		},
	});

	const saveHandler = () => {
		onClose();
	};

	return (
		<ClayModal observer={observer} size="full-screen">
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
						<ClayButton displayType="secondary" onClick={onClose}>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton onClick={saveHandler}>
							{Liferay.Language.get('save')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</ClayModal>
	);
}
