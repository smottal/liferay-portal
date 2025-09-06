/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IInternalRenderer} from '@liferay/frontend-data-set-web';
import {openModal} from 'frontend-js-components-web';

import PermissionModal from '../../structure_builder/components/default_permissions/PermissionModal';
import manageMembersAction, {
	ManageMembersData,
} from './actions/manageMembersAction';
import manageSitesAction, {ManageSitesData} from './actions/manageSitesAction';
import SpaceRenderer from './cell_renderers/SpaceRenderer';
import addOnClickToCreationMenuItems from './utils/addOnClickToCreationMenuItems';

const ACTIONS = {};

export default function AllSpacesFDSPropsTransformer({
	additionalProps,
	creationMenu,
	itemsActions = [],
	...otherProps
}: {
	additionalProps: any;
	creationMenu: any;
	itemsActions?: any[];
	otherProps: any;
}) {
	return {
		...otherProps,
		creationMenu: {
			...creationMenu,
			primaryItems: addOnClickToCreationMenuItems(
				creationMenu.primaryItems,
				ACTIONS
			),
		},
		customRenderers: {
			tableCell: [
				{
					component: SpaceRenderer,
					name: 'spaceTableCellRenderer',
					type: 'internal',
				} as IInternalRenderer,
			],
		},
		itemsActions: itemsActions.map((action) => {
			const pinnedAssetLibraryIds = additionalProps.pinnedAssetLibraryIds;

			if (action?.data?.id === 'pin') {
				return {
					...action,
					isVisible: (item: any) =>
						!pinnedAssetLibraryIds?.includes(item.id.toString()),
				};
			}

			if (action?.data?.id === 'unpin') {
				return {
					...action,
					isVisible: (item: any) =>
						!!pinnedAssetLibraryIds?.includes(item.id.toString()),
				};
			}

			return action;
		}),
		onActionDropdownItemClick: ({
			action,
			itemData,
			loadData,
		}: {
			action: {
				data: {
					id: string;
					permissionKey: string | null;
				};
			};
			itemData: {
				creatorUserId: string;
				externalReferenceCode: string;
				id: string;
				siteId: string;
			};
			loadData: () => {};
		}) => {
			if (action.data.id === 'pin' || action.data.id === 'unpin') {
				window.location.reload();
			}

			if (action.data.id === 'default-permissions') {
				event?.preventDefault();

				console.error(itemData);

				openModal({
					containerProps: {
						className: '',
					},
					contentComponent: ({
						closeModal,
					}: {
						closeModal: () => void;
					}) =>
						PermissionModal({
							...(additionalProps.defaultPermissionAdditionalProps ||
								{}),
							classExternalReferenceCode:
								itemData.externalReferenceCode,
							className: 'com.liferay.depot.model.DepotEntry',
							closeModal,
							roles: [
								{
									key: 'CMS Administrator',
									name: 'CMS Administrator',
								},
								{key: 'guest', name: 'Guest'},
								{key: 'owner', name: 'Owner'},
							],
						}),
					size: 'full-screen',
				});
			}
			else if (action.data.id === 'view-members') {
				const hasAssignMembersPermission =
					action.data.permissionKey === 'assign-members';
				const assetLibraryCreatorUserId = itemData.creatorUserId;
				const assetLibraryId = itemData.id;

				const data: ManageMembersData = {
					assetLibraryCreatorUserId,
					assetLibraryId,
					hasAssignMembersPermission,
					title: Liferay.Language.get('all-members'),
				};

				manageMembersAction(data, loadData);
			}
			else if (action.data.id === 'view-sites') {
				const hasConnectSitesPermission =
					action.data.permissionKey === 'connect-sites';

				const data: ManageSitesData = {
					groupId: itemData.siteId,
					hasConnectSitesPermission,
				};

				manageSitesAction(data, loadData);
			}
		},
	};
}
