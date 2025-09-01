/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayCheckbox, ClayInput} from '@clayui/form';
import ClayManagementToolbar from '@clayui/management-toolbar';
import {ClayPaginationBarWithBasicItems} from '@clayui/pagination-bar';
import ClayTable from '@clayui/table';
import React, {ChangeEvent, useCallback, useEffect, useState} from 'react';

import {IActionsType, IRoleType} from './PermissionMatrixContainer';

interface IDataType {
	[key: string]: boolean;
}

export default function PermissionMatrix({
	actions,
	roles,
	values,
}: {
	actions: string[];
	roles: IRoleType[];
	values?: IActionsType;
}) {
	const [data, setData] = useState<IDataType>({});
	const [filteredRoles, setFilteredRoles] = useState(roles);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		pageSize: 20,
	});
	const [search, setSearch] = useState('');

	useEffect(() => {
		const formattedData: IDataType = {};

		for (const [role, actions] of Object.entries(values || {})) {
			actions.map((action) => {
				formattedData[`${role}_${action}`] = true;
			});
		}

		setData(formattedData);
	}, [values]);

	useEffect(() => {
		setFilteredRoles(
			roles.filter((role) =>
				role.name.toLowerCase().includes(search.toLowerCase())
			)
		);
	}, [roles, search]);

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const key = event.currentTarget.value;

		setData((prevState) => {
			return {
				...prevState,
				[key]: !prevState[key],
			};
		});
	};

	const handlePaginationDeltaChange = useCallback((value: any) => {
		setPagination((prevState) => ({
			...prevState,
			pageSize: value,
		}));
	}, []);

	const handlePaginationPageChange = useCallback((value: any) => {
		setPagination((prevState) => ({
			...prevState,
			currentPage: value,
		}));
	}, []);

	return (
		<>
			<ClayManagementToolbar>
				<ClayManagementToolbar.Search>
					<ClayInput.Group>
						<ClayInput.GroupItem>
							<ClayInput
								aria-label="search"
								className="form-control"
								data-testid="input-search"
								onChange={({target: {value}}) => {
									setSearch(value);
								}}
								type="text"
								value={search}
							/>
						</ClayInput.GroupItem>
					</ClayInput.Group>
				</ClayManagementToolbar.Search>
			</ClayManagementToolbar>

			<ClayTable responsive={true}>
				<ClayTable.Head>
					<>
						<ClayTable.Cell id="0_0">
							<></>
						</ClayTable.Cell>

						{actions.map((action) => {
							return (
								<ClayTable.Cell
									align="center"
									data-testid={`head-cell-${action}`}
									key={`0_${action}`}
								>
									{Liferay.Language.get(action)}
								</ClayTable.Cell>
							);
						})}
					</>
				</ClayTable.Head>

				<ClayTable.Body>
					{filteredRoles
						.slice(
							(pagination.currentPage - 1) * pagination.pageSize,
							pagination.currentPage * pagination.pageSize
						)
						.map((role) => {
							return (
								<ClayTable.Row key={role.key}>
									<>
										<ClayTable.Cell
											data-testid={`row-cell-${role.key}`}
											key={`${role.key}_0`}
										>
											{role.name}
										</ClayTable.Cell>

										{actions.map((action) => {
											return (
												<ClayTable.Cell
													align="center"
													data-testid={`row-cell-${role.key}_${action}`}
													key={`${role.key}_${action}`}
												>
													<ClayCheckbox
														checked={
															data[
																`${role.key}_${action}`
															]
														}
														data-testid={`row-checkbox-${role.key}_${action}`}
														inline
														key={`${role.key}_${action}`}
														onChange={handleChange}
														value={`${role.key}_${action}`}
													/>
												</ClayTable.Cell>
											);
										})}
									</>
								</ClayTable.Row>
							);
						})}
				</ClayTable.Body>
			</ClayTable>

			<div className="data-set-pagination-wrapper">
				<ClayPaginationBarWithBasicItems
					activeDelta={pagination.pageSize}
					deltas={[20, 40, 60].map((size) => ({
						label: size,
					}))}
					ellipsisBuffer={3}
					onActiveChange={handlePaginationPageChange}
					onDeltaChange={handlePaginationDeltaChange}
					totalItems={filteredRoles.length}
				/>
			</div>
		</>
	);
}
