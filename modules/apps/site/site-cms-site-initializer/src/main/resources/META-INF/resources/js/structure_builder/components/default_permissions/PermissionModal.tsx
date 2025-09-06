/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayModal from '@clayui/modal';
import {openToast} from 'frontend-js-components-web';
import {sub} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';

import CMSDefaultPermissionService, {
	CMSDefaultPermission,
} from '../../../common/services/CMSDefaultPermissionService';
import PermissionMatrixContainer, {
	IActionsType2,
	IRoleType,
	IValuesType,
} from './PermissionMatrixContainer';

//TODO: passare il loading per disabilitare le checkbox e la ricerca
//TODO: code refactor
//TODO: ruoli
//TODO: test
//TODO: prima colonna fissa

export default function PermissionModal({
	actions,
	classExternalReferenceCode,
	className,
	closeModal,
	roles,
}: {
	actions: IActionsType2;
	classExternalReferenceCode: string;
	className: string;
	closeModal: () => void;
	roles: IRoleType[];
}) {
	const [
		currentCMSDefaultPermissionObjectEntry,
		setCurrentCMSDefaultPermissionObjectEntry,
	] = useState<CMSDefaultPermission | null>(null);
	const [currentValues, setCurrentValues] = useState<IValuesType>({});
	const [loading, setLoading] = useState(false);

	const closeHandler = useCallback(() => {
		closeModal();
	}, [closeModal]);

	const saveHandler = useCallback(() => {
		setLoading(true);

		if (currentCMSDefaultPermissionObjectEntry) {
			CMSDefaultPermissionService.updateCMSDefaultPermission({
				externalReferenceCode:
					currentCMSDefaultPermissionObjectEntry.externalReferenceCode,
				defaultPermissions: JSON.stringify(currentValues),
			})
				.then(() => {
					openToast({
						message: Liferay.Language.get(
							'your-request-completed-successfully'
						),
						type: 'success',
					});

					closeModal();
				})
				.catch((error) => {
					openToast({
						message: Liferay.Language.get(
							'an-unexpected-system-error-occurred'
						),
						type: 'danger',
					});
				})
				.finally(() => {
					setLoading(false);
				});
		}
		else {
			CMSDefaultPermissionService.addCMSDefaultPermission({
				classExternalReferenceCode,
				className,
				defaultPermissions: JSON.stringify(currentValues),
			})
				.then(() => {
					openToast({
						message: Liferay.Language.get(
							'your-request-completed-successfully'
						),
						type: 'success',
					});

					closeModal();
				})
				.catch((error) => {
					openToast({
						message: Liferay.Language.get(
							'an-unexpected-system-error-occurred'
						),
						type: 'danger',
					});
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [
		currentCMSDefaultPermissionObjectEntry,
		classExternalReferenceCode,
		className,
		currentValues,
		closeModal,
	]);

	const onChangeHandler = useCallback((data: any) => {
		setCurrentValues(data);
	}, []);

	useEffect(() => {
		setLoading(true);

		CMSDefaultPermissionService.getCMSDefaultPermission({
			classExternalReferenceCode,
			className,
		})
			.then((value) => {
				setCurrentCMSDefaultPermissionObjectEntry(value);
				setCurrentValues(JSON.parse(value.defaultPermissions));
			})
			.catch((error) => {
				console.error(error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [classExternalReferenceCode, className]);

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
					onChange={onChangeHandler}
					roles={roles}
					values={currentValues}
				/>
			</ClayModal.Body>

			<ClayModal.Footer
				last={
					<ClayButton.Group spaced>
						<ClayButton
							disabled={loading}
							displayType="secondary"
							onClick={closeHandler}
						>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton disabled={loading} onClick={saveHandler}>
							{Liferay.Language.get('save')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</>
	);
}
