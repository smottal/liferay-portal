/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import DropDown from '@clayui/drop-down';
import ClayTable from '@clayui/table';
import React from 'react';

const DeliveryGroupHeaderCell = ({
	deliveryGroup,
	handleDeleteDeliveryGroup,
	handleEditDeliveryGroup,
}) => {
	return (
		<ClayTable.Cell headingCell key={deliveryGroup.id}>
			<div className="align-items-center d-flex flex-nowrap">
				<div className="flex-grow-1">
					<div className="text-nowrap text-truncate">
						{deliveryGroup.name}
					</div>

					{!!deliveryGroup.deliveryDate && (
						<div className="text-2 text-secondary text-truncate">
							{new Intl.DateTimeFormat(
								Liferay.ThemeDisplay.getBCP47LanguageId(),
								{dateStyle: 'short'}
							).format(new Date(deliveryGroup.deliveryDate))}
						</div>
					)}
				</div>

				<DropDown
					trigger={
						<ClayButtonWithIcon
							aria-label={Liferay.Language.get('Actions')}
							displayType="unstyled"
							size="xs"
							symbol="ellipsis-v"
						/>
					}
				>
					<DropDown.ItemList>
						<DropDown.Item
							aria-label={Liferay.Language.get('edit')}
							key={deliveryGroup.id + '_menuEdit'}
							onClick={() => {
								handleEditDeliveryGroup(deliveryGroup);
							}}
						>
							{Liferay.Language.get('edit')}
						</DropDown.Item>

						<DropDown.Item
							aria-label={Liferay.Language.get('delete')}
							key={deliveryGroup.id + '_menuDelete'}
							onClick={() => {
								handleDeleteDeliveryGroup(deliveryGroup);
							}}
						>
							{Liferay.Language.get('delete')}
						</DropDown.Item>
					</DropDown.ItemList>
				</DropDown>
			</div>
		</ClayTable.Cell>
	);
};

export default DeliveryGroupHeaderCell;
