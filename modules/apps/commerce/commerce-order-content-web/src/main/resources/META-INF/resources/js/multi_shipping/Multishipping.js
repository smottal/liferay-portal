/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton, {ClayButtonWithIcon} from '@clayui/button';
import DropDown from '@clayui/drop-down';
import ClayEmptyState from '@clayui/empty-state';
import {ClayInput} from '@clayui/form';
import ClayLink from '@clayui/link';
import ClayManagementToolbar from '@clayui/management-toolbar';
import ClayModal, {useModal} from '@clayui/modal';
import {ClayPaginationBarWithBasicItems} from '@clayui/pagination-bar';
import ClayTable from '@clayui/table';
import {CommerceServiceProvider} from 'commerce-frontend-js';
import {sub} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';

import './index.scss';
import AddDeliveryGroupButton from './AddDeliveryGroupButton';
import DeliveryGroupHeaderCell from './DeliveryGroupHeaderCell';
import DeliveryGroupModal from './DeliveryGroupModal';

const MAX_DELIVERY_GROUPS = 20;

const Multishipping = ({namespace, orderId, spritemap}) => {
	const {
		observer: observerModalOrderItemDetail,
		onOpenChange: onOpenModalOrderItemDetail,
		open: openModalOrderItemDetail,
	} = useModal({
		onClose: () => {
			setCurrentOrderItem(null);
		},
	});
	const {
		observer: observerModalDeliveryGroup,
		onOpenChange: onOpenModalDeliveryGroup,
		open: openModalDeliveryGroup,
	} = useModal({
		onClose: () => {
			setCurrentDeliveryGroup(null);
		},
	});
	const [currentDeliveryGroup, setCurrentDeliveryGroup] = useState(null);
	const [currentOrderItem, setCurrentOrderItem] = useState(null);
	const [deliveryGroups, setDeliveryGroups] = useState([]);
	const [filter, setFilter] = useState('');
	const [orderItems, setOrderItems] = useState([]);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		pageSize: 20,
	});

	const handleDeleteDeliveryGroup = useCallback((deliveryGroup) => {
		console.error('cancello', deliveryGroup);
	}, []);

	const handleEditDeliveryGroup = useCallback(
		(deliveryGroup) => {
			setCurrentDeliveryGroup(deliveryGroup);

			onOpenModalDeliveryGroup(true);
		},
		[onOpenModalDeliveryGroup]
	);

	const handlePaginationDeltaChange = useCallback((value) => {
		setPagination((prevState) => ({
			...prevState,
			pageSize: value,
		}));
	}, []);

	const handlePaginationPageChange = useCallback((value) => {
		setPagination((prevState) => ({
			...prevState,
			currentPage: value,
		}));
	}, []);

	const handleSearchSubmit = useCallback(
		(event) => {
			event.preventDefault();

			console.error(filter);
		},
		[filter]
	);

	const handleSubmitDeliveryGroup = useCallback(
		(deliveryGroup) => {
			console.error('deliveryGroup', deliveryGroup);

			const index = deliveryGroups.findIndex(
				(item) => item.id === deliveryGroup.id
			);

			if (index >= 0) {
				deliveryGroups[index] = deliveryGroup;
			}
			else {
				deliveryGroup.id = new Date().getTime();
				deliveryGroups.push(deliveryGroup);
			}

			setDeliveryGroups([...deliveryGroups]);

			onOpenModalDeliveryGroup(false);

			setCurrentDeliveryGroup(null);
		},
		[deliveryGroups, onOpenModalDeliveryGroup]
	);

	useEffect(() => {
		CommerceServiceProvider.DeliveryCartAPI('v1')
			.getItemsByCartId(orderId)
			.then((response) => {
				setOrderItems(response.items);
			})
			.catch((error) => {
				Liferay.Util.openToast({
					message:
						error.detail ||
						error.errorDescription ||
						Liferay.Language.get(
							'an-unexpected-system-error-occurred'
						),
					type: 'danger',
				});
			});
	}, [orderId]);

	const managementBar = (
		<div className="management-bar-wrapper">
			<>
				<ClayManagementToolbar>
					<ClayManagementToolbar.Search onSubmit={handleSearchSubmit}>
						<ClayInput.Group>
							<ClayInput.GroupItem>
								<ClayInput
									aria-label="Search"
									className="form-control input-group-inset input-group-inset-after"
									onChange={({target: {value: filter}}) => {
										setFilter(filter);
									}}
									type="text"
									value={filter}
								/>

								<ClayInput.GroupInsetItem after tag="span">
									<ClayButtonWithIcon
										aria-label="Search"
										displayType="unstyled"
										spritemap={spritemap}
										symbol="search"
										type="submit"
									/>
								</ClayInput.GroupInsetItem>
							</ClayInput.GroupItem>
						</ClayInput.Group>
					</ClayManagementToolbar.Search>

					<ClayManagementToolbar.ItemList>
						<ClayManagementToolbar.Item>
							<AddDeliveryGroupButton
								accountId={
									Liferay.CommerceContext.account.accountId
								}
								disabled={
									deliveryGroups.length >= MAX_DELIVERY_GROUPS
								}
								handleSubmit={handleSubmitDeliveryGroup}
								hasManageAddressesPermission={true}
								namespace={namespace}
								spritemap={spritemap}
							/>
						</ClayManagementToolbar.Item>
					</ClayManagementToolbar.ItemList>
				</ClayManagementToolbar>
			</>
		</div>
	);

	const view = (
		<div className="data-set-content-wrapper">
			{orderItems.length ? (
				<ClayTable borderedColumns borderless striped>
					<ClayTable.Head>
						<ClayTable.Row>
							<ClayTable.Cell headingCell key="sku">
								<div className="align-items-center d-flex flex-nowrap">
									<div className="flex-grow-1">
										<div className="text-nowrap text-truncate">
											{Liferay.Language.get('sku')}
										</div>
									</div>
								</div>
							</ClayTable.Cell>

							<ClayTable.Cell headingCell key="quantity">
								<div className="align-items-center d-flex flex-nowrap">
									<div className="flex-grow-1">
										<div className="text-nowrap text-truncate">
											{Liferay.Language.get('quantity')}
										</div>
									</div>
								</div>
							</ClayTable.Cell>

							{deliveryGroups.map((deliveryGroup) => (
								<DeliveryGroupHeaderCell
									deliveryGroup={deliveryGroup}
									handleDeleteDeliveryGroup={
										handleDeleteDeliveryGroup
									}
									handleEditDeliveryGroup={
										handleEditDeliveryGroup
									}
									key={deliveryGroup.id}
								/>
							))}
						</ClayTable.Row>
					</ClayTable.Head>

					<ClayTable.Body>
						{orderItems.map((orderItem) => (
							<ClayTable.Row key={orderItem.id}>
								<ClayTable.Cell>
									<div className="align-items-center d-flex flex-nowrap">
										<ClayLink
											className="flex-grow-1 text-nowrap text-truncate"
											displayType="unstyled"
											onClick={() => {
												setCurrentOrderItem(orderItem);

												onOpenModalOrderItemDetail(
													true
												);
											}}
										>
											{orderItem.sku}
										</ClayLink>

										<DropDown
											trigger={
												<ClayButtonWithIcon
													aria-label={Liferay.Language.get(
														'Actions'
													)}
													displayType="unstyled"
													size="xs"
													symbol="ellipsis-v"
												/>
											}
										>
											<DropDown.ItemList>
												<DropDown.Item
													aria-label={Liferay.Language.get(
														'menu1'
													)}
													key={
														orderItem.id + '_menu1'
													}
													onClick={() => {}}
												>
													{Liferay.Language.get(
														'menu1'
													)}
												</DropDown.Item>

												<DropDown.Item
													aria-label={Liferay.Language.get(
														'menu2'
													)}
													key={
														orderItem.id + '_menu2'
													}
													onClick={() => {}}
												>
													{Liferay.Language.get(
														'menu2'
													)}
												</DropDown.Item>
											</DropDown.ItemList>
										</DropDown>
									</div>
								</ClayTable.Cell>

								<ClayTable.Cell>
									{orderItem.quantity}
								</ClayTable.Cell>

								{deliveryGroups.map((deliveryGroup) => (
									<ClayTable.Cell
										className="deliveryGroup"
										key={`${orderItem.id}_${deliveryGroup.id}`}
									>
										<ClayInput type="number" value={10} />
									</ClayTable.Cell>
								))}
							</ClayTable.Row>
						))}
					</ClayTable.Body>
				</ClayTable>
			) : (
				<ClayEmptyState
					description={Liferay.Language.get(
						'sorry,-no-results-were-found'
					)}
					imgSrc={
						Liferay.ThemeDisplay.getPathThemeImages() +
						'/states/search_state.svg'
					}
					title={Liferay.Language.get('no-results-found')}
				/>
			)}
		</div>
	);

	const paginationComponent = (
		<div className="data-set-pagination-wrapper">
			<ClayPaginationBarWithBasicItems
				activeDelta={pagination.pageSize}
				deltas={[4, 8, 20, 40, 60].map((size) => ({
					label: size,
				}))}
				ellipsisBuffer={3}
				onActiveChange={handlePaginationPageChange}
				onDeltaChange={handlePaginationDeltaChange}
				totalItems={orderItems.length}
			/>
		</div>
	);

	const modalOrderItemDetail = currentOrderItem && (
		<ClayModal
			id="dshajkdhasjkdsa"
			observer={observerModalOrderItemDetail}
			size="md"
			spritemap={spritemap}
		>
			<ClayModal.Header>
				{sub(
					Liferay.Language.get('view-x-details'),
					currentOrderItem.sku
				)}
			</ClayModal.Header>

			<ClayModal.Body>
				<p className="text-weight-bold">{currentOrderItem.sku}</p>

				<p>
					{`${Liferay.Language.get('uom')}: ${currentOrderItem.uom || ''}`}
				</p>

				<p>
					{`${Liferay.Language.get('options')}: ${currentOrderItem.options || ''}`}
				</p>

				<p>
					{`${Liferay.Language.get('list-price')}: ${currentOrderItem.price?.priceFormatted || ''}`}
				</p>

				<p>{`${Liferay.Language.get('promotion-price')}: bho`}</p>

				<p>
					{`${Liferay.Language.get('discount')}: ${currentOrderItem.price?.discountFormatted || ''}`}
				</p>

				<p>
					{`${Liferay.Language.get('total')}: ${currentOrderItem.price?.finalPriceFormatted}` ||
						''}
				</p>
			</ClayModal.Body>
		</ClayModal>
	);

	return (
		<div className="data-set data-set-fluid">
			{managementBar}

			<div className="container-fluid container-fluid-max-xl">
				{view}

				{paginationComponent}

				{openModalOrderItemDetail && modalOrderItemDetail}
			</div>
		</div>
	);
};

export default Multishipping;
