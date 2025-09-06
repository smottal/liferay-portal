/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ApiHelper from './ApiHelper';

export type CMSDefaultPermission = {
	classExternalReferenceCode: string;
	className: string;
	defaultPermissions: string;
	externalReferenceCode: string;
	id: number;
};

async function addCMSDefaultPermission({
	classExternalReferenceCode,
	className,
	defaultPermissions,
}: {
	classExternalReferenceCode: string;
	className: string;
	defaultPermissions: string;
}) {
	return await ApiHelper.post(`/o/cms/default-permissions`, {
		classExternalReferenceCode,
		className,
		defaultPermissions,
	});
}

async function getCMSDefaultPermission({
	classExternalReferenceCode,
	className,
}: {
	classExternalReferenceCode: string;
	className: string;
}): Promise<CMSDefaultPermission> {
	const url = `/o/cms/default-permissions?filter=(classExternalReferenceCode eq '${classExternalReferenceCode}') and (className eq '${className}')`;

	const {data, error} = await ApiHelper.get<{
		items: CMSDefaultPermission[];
		lastPage: number;
		page: number;
		totalCount: number;
	}>(url);

	if (data && data.items.length) {
		return data.items[0];
	}

	throw new Error(error || '');
}

async function updateCMSDefaultPermission({
	defaultPermissions,
	externalReferenceCode,
}: {
	defaultPermissions: string;
	externalReferenceCode: string;
}) {
	return await ApiHelper.patch(
		{
			defaultPermissions,
		},
		`/o/cms/default-permissions/by-external-reference-code/${externalReferenceCode}`
	);
}

export default {
	addCMSDefaultPermission,
	getCMSDefaultPermission,
	updateCMSDefaultPermission,
};
