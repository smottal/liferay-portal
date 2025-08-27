/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom/extend-expect';
import {render, screen, waitFor} from '@testing-library/react';
import React from 'react';

import PermissionMatrixContainer, {
	IActionsType,
	IRoleType,
	ITypeType,
	IValuesType,
} from '../../../../../src/main/resources/META-INF/resources/js/structure_builder/components/default_permissions/PermissionMatrixContainer';

const renderComponent = async (props: {
	actions: IActionsType;
	roles: IRoleType[];
	types?: ITypeType[];
	values?: IValuesType;
}) => {
	return render(<PermissionMatrixContainer {...props} />);
};

describe('Permission Matrix Container', () => {
	it('Show tabs', async () => {
		const props = {
			actions: {
				L_CONTENT: ['UPDATE', 'VIEW'],
				L_FILE: ['UPDATE', 'VIEW', 'VIEW2'],
				L_FOLDER: [
					'UPDATE',
					'VIEW',
					'UPDATE2',
					'VIEW2',
					'UPDATE3',
					'VIEW3',
				],
			},
			roles: [
				{key: 'admin', name: 'Administrator'},
				{key: 'guest', name: 'Guest'},
			],
		};

		renderComponent(props);

		expect(screen.getByRole('tab', {name: /folder/i})).toBeInTheDocument();
		expect(screen.getByRole('tab', {name: /content/i})).toBeInTheDocument();
		expect(screen.getByRole('tab', {name: /file/i})).toBeInTheDocument();
	});

	it('Switch matrix on tab change', async () => {
		const props = {
			actions: {
				L_CONTENT: ['UPDATE', 'VIEW'],
				L_FILE: ['UPDATE', 'VIEW', 'VIEW2'],
				L_FOLDER: [
					'UPDATE',
					'UPDATE2',
					'UPDATE3',
					'VIEW',
					'VIEW2',
					'VIEW3',
				],
			},
			roles: [{key: 'admin', name: 'Administrator'}],
		};

		renderComponent(props);

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE2`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE3`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW2`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW3`)
			).toBeInTheDocument();
		});

		screen.getByRole('tab', {name: /content/i}).click();

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE2`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE3`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW2`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW3`)
			).not.toBeInTheDocument();
		});

		screen.getByRole('tab', {name: /file/i}).click();

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE2`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE3`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW2`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW3`)
			).not.toBeInTheDocument();
		});

		screen.getByRole('tab', {name: /folder/i}).click();

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE2`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE3`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW2`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW3`)
			).toBeInTheDocument();
		});
	});

	it('Preload matrix on tab change', async () => {
		const props = {
			actions: {
				L_CONTENT: ['UPDATE', 'VIEW'],
				L_FILE: ['UPDATE', 'VIEW', 'VIEW2'],
				L_FOLDER: [
					'UPDATE',
					'UPDATE2',
					'UPDATE3',
					'VIEW',
					'VIEW2',
					'VIEW3',
				],
			},
			roles: [
				{key: 'admin', name: 'Administrator'},
				{key: 'guest', name: 'Guest'},
				{key: 'owner', name: 'Owner'},
			],
			values: {
				L_CONTENT: {admin: ['VIEW']},
				L_FILE: {
					admin: ['UPDATE', 'VIEW'],
					guest: ['VIEW'],
					owner: ['VIEW'],
				},
				L_FOLDER: {admin: ['UPDATE', 'VIEW'], owner: ['VIEW']},
			},
		};

		renderComponent(props);

		await waitFor(() => {
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE`)
			).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE3`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-admin_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_VIEW3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE3`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-owner_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW3`)
			).not.toBeChecked();
		});

		screen.getByRole('tab', {name: /content/i}).click();

		await waitFor(() => {
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-admin_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW`)
			).not.toBeChecked();
		});

		screen.getByRole('tab', {name: /file/i}).click();

		await waitFor(() => {
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE`)
			).toBeChecked();
			expect(screen.getByTestId(`row-checkbox-admin_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-guest_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-owner_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW2`)
			).not.toBeChecked();
		});

		screen.getByRole('tab', {name: /folder/i}).click();

		await waitFor(() => {
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE`)
			).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_UPDATE3`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-admin_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-admin_VIEW3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_UPDATE3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-guest_VIEW3`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_UPDATE3`)
			).not.toBeChecked();
			expect(screen.getByTestId(`row-checkbox-owner_VIEW`)).toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW2`)
			).not.toBeChecked();
			expect(
				screen.getByTestId(`row-checkbox-owner_VIEW3`)
			).not.toBeChecked();
		});
	});

	it('Dynamic tabs', async () => {
		const props = {
			actions: {
				L_CONTENT: ['UPDATE1', 'VIEW1'],
				L_FILE: ['UPDATE2', 'VIEW2'],
				L_FOLDER: ['UPDATE3', 'VIEW3'],
			},
			roles: [{key: 'admin', name: 'Administrator'}],
			types: [
				{key: 'L_CONTENT', label: 'content'},
				{key: 'L_FILE', label: 'file'},
			],
			values: {
				L_CONTENT: {admin: ['VIEW1']},
				L_FILE: {admin: ['VIEW2']},
				L_FOLDER: {admin: ['UPDATE3', 'VIEW3']},
			},
		};

		renderComponent(props);

		expect(
			screen.queryByRole('tab', {name: /folder/i})
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('tab', {name: /content/i})
		).toBeInTheDocument();
		expect(screen.queryByRole('tab', {name: /file/i})).toBeInTheDocument();

		await waitFor(() => {
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE3`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW3`)
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE1`)
			).toBeInTheDocument();
			expect(
				screen.queryByTestId(`row-checkbox-admin_UPDATE1`)
			).not.toBeChecked();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW1`)
			).toBeChecked();
			expect(
				screen.queryByTestId(`row-checkbox-admin_VIEW1`)
			).toBeChecked();
		});
	});
});
