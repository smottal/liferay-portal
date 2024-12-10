/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.product.internal.upgrade.v5_25_1;

import com.liferay.account.model.AccountEntry;
import com.liferay.account.model.AccountGroup;
import com.liferay.account.settings.AccountEntryGroupSettings;
import com.liferay.commerce.product.model.CPConfigurationEntry;
import com.liferay.commerce.product.model.CPConfigurationList;
import com.liferay.commerce.product.model.CPDefinition;
import com.liferay.commerce.product.model.CommerceCatalog;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CPConfigurationEntryLocalServiceUtil;
import com.liferay.commerce.product.service.CPConfigurationEntryLocalServiceWrapper;
import com.liferay.commerce.product.service.CPConfigurationListLocalService;
import com.liferay.commerce.product.service.CPConfigurationListLocalServiceUtil;
import com.liferay.commerce.product.service.CPConfigurationListRelLocalService;
import com.liferay.commerce.product.service.CPConfigurationListRelLocalServiceUtil;
import com.liferay.commerce.product.service.CommerceChannelRelLocalService;
import com.liferay.commerce.product.service.CommerceChannelRelLocalServiceUtil;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.configuration.module.configuration.ConfigurationProvider;
import com.liferay.portal.kernel.dao.jdbc.AutoBatchPreparedStatementUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.upgrade.UpgradeProcess;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.uuid.PortalUUIDUtil;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * @author Stefano Motta
 */
public class CPConfigurationListEligibilityUpgradeProcess
	extends UpgradeProcess {

	public CPConfigurationListEligibilityUpgradeProcess(
		CommerceChannelRelLocalService commerceChannelRelLocalService,
		CPConfigurationListLocalService cpConfigurationListLocalService,
		CPConfigurationListRelLocalService cpConfigurationListRelLocalService,
		Portal portal) {

		_commerceChannelRelLocalService = commerceChannelRelLocalService;
		_cpConfigurationListLocalService = cpConfigurationListLocalService;
		_cpConfigurationListRelLocalService = cpConfigurationListRelLocalService;
		_portal = portal;
	}

	private final Portal _portal;
	private final CommerceChannelRelLocalService _commerceChannelRelLocalService;
	private final CPConfigurationListRelLocalService _cpConfigurationListRelLocalService;
	private final CPConfigurationListLocalService _cpConfigurationListLocalService;

	@Override
	protected void doUpgrade() throws Exception {
		long accountGroupClassNameId = _portal.getClassNameId(
			AccountGroup.class.getName());
		long commerceCatalogClassNameId = _portal.getClassNameId(
			CommerceCatalog.class.getName());
		long cpConfigurationListClassNameId = _portal.getClassNameId(
			CPConfigurationList.class.getName());
		long cpDefinitionClassNameId = _portal.getClassNameId(
			CPDefinition.class.getName());

		try (
			PreparedStatement insertPreparedStatement =
				AutoBatchPreparedStatementUtil.autoBatch(connection,
					StringBundler.concat(
						"insert into CPConfigurationEntry (mvccVersion, ",
						"ctCollectionId, uuid_, externalReferenceCode, ",
						"CPConfigurationEntryId, companyId, userId, username, ",
						"createDate, modifiedDate, classNameId, classPK, ",
						"CPConfigurationListId, CPTaxCategoryId, ",
						"allowedOrderQuantities, backOrders, ",
						"CPDefinitionInventoryEngine, depth, ",
						"displayAvailability, displayStockQuantity, ",
						"freeShipping, height, lowStockActivity, ",
						"maxOrderQuantity, minOrderQuantity, ",
						"minStockQuantity, multipleOrderQuantity, ",
						"purchasable, shippable, shippingExtraPrice, ",
						"shipSeparately, taxExempt, visible, weight, width, ",
						"commerceAvailabilityEstimateId, groupId) values (?, ",
						"?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ",
						"?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ",
						"?, ?)"));

			PreparedStatement selectPreparedStatement1 =
				connection.prepareStatement(
					"select Group_.companyId, Group_.groupId from " +
					"CommerceCatalog join Group_ on Group_.classNameId = ? " +
					"and Group_.classPK = CommerceCatalog.commerceCatalogId");

			PreparedStatement selectPreparedStatement2 =
				connection.prepareStatement(
					StringBundler.concat(
						"select CPDefinition.CPDefinitionId, Rel.type_, ",
						"Rel.classPK, Rel.resourceId from CPDefinition join ",
						"(select 'C' as type_, classPK, commerceChannelId as ",
						"resourceId from CommerceChannelRel where classNameId ",
						"= ? union select 'A' as type_, classPK, ",
						"accountGroupId as resourceId from AccountGroupRel ",
						"where classNameId = ?) as Rel on ",
						"(CPDefinition.CPDefinitionId = Rel.classPK and ",
				 		"CPDefinition.groupId = ?) order by Rel.classPK"));

			PreparedStatement selectPreparedStatement3 =
				connection.prepareStatement(
					"select distinct CPConfigurationListId from " +
					"CPConfigurationListRel where classNameId = ? and " +
					"classPK = ?");

			PreparedStatement selectPreparedStatement4 =
				connection.prepareStatement(
					"select distinct classPK as CPConfigurationListId from " +
					"CommerceChannelRel where classNameId = ? and " +
					"commerceChannelId = ?");

			PreparedStatement updatePreparedStatement =
				connection.prepareStatement(
					StringBundler.concat(
						"update CPConfigurationEntry set visible = ? where ",
						"classNameId = ? and CPConfigurationListId = ? and ",
						"groupId = ? and classPK in (select classPK from ",
						"CPConfigurationEntry where classNameId = ? and ",
						"CPConfigurationListId != ? and groupId = ?)"))) {

			selectPreparedStatement1.setLong(1, commerceCatalogClassNameId);

			ResultSet resultSet = selectPreparedStatement1.executeQuery();

			while (resultSet.next()) {
				long groupId = resultSet.getLong("groupId");

				CPConfigurationList masterCPConfigurationList =
					_cpConfigurationListLocalService.
						getMasterCPConfigurationList(groupId);

				if (masterCPConfigurationList == null) {
					continue;
				}

				CPConfigurationEntry templateCPConfigurationEntry =
					masterCPConfigurationList.fetchTemplateCPConfigurationEntry();

				if (templateCPConfigurationEntry == null) {
					continue;
				}

				selectPreparedStatement2.setLong(1, cpDefinitionClassNameId);
				selectPreparedStatement2.setLong(2, cpDefinitionClassNameId);
				selectPreparedStatement2.setLong(3, groupId);

				_addCPConfigurationLists(
					masterCPConfigurationList, selectPreparedStatement2);

				_addCPConfigurationEntries(
					accountGroupClassNameId, cpConfigurationListClassNameId,
					cpDefinitionClassNameId, insertPreparedStatement,
					selectPreparedStatement2, selectPreparedStatement3,
					selectPreparedStatement4,
					templateCPConfigurationEntry);

				_updateMasterCPConfigurationEntries(
					cpDefinitionClassNameId, groupId, masterCPConfigurationList,
					updatePreparedStatement);
			}
		}
	}

	private void _addCPConfigurationEntries(
			long accountGroupClassNameId, long cpConfigurationListClassNameId,
			long cpDefinitionClassNameId,
			PreparedStatement insertPreparedStatement,
			PreparedStatement selectPreparedStatement1,
			PreparedStatement selectPreparedStatement2,
			PreparedStatement selectPreparedStatement3,
			CPConfigurationEntry templateCPConfigurationEntry)
		throws Exception {

		Set<Long> createdCPConfigurationEntries = new HashSet<>();
		long currentClassPK = 0;

		ResultSet resultSet1 = selectPreparedStatement1.executeQuery();

		while (resultSet1.next()) {
			insertPreparedStatement.clearBatch();

			long classPK = resultSet1.getLong("classPK");
			long resourceId = resultSet1.getLong("resourceId");
			String type = resultSet1.getString("type_");

			if (classPK != currentClassPK) {
				createdCPConfigurationEntries = new HashSet<>();

				currentClassPK = classPK;
			}

			ResultSet resultSet2;

			if (type.equals("A")) {
				selectPreparedStatement2.setLong(1, accountGroupClassNameId);
				selectPreparedStatement2.setLong(2, resourceId);

				resultSet2 = selectPreparedStatement2.executeQuery();
			}
			else {
				selectPreparedStatement3.setLong(1, cpConfigurationListClassNameId);
				selectPreparedStatement3.setLong(2, resourceId);

				resultSet2 = selectPreparedStatement3.executeQuery();
			}

			while (resultSet2.next()) {
				long cpConfigurationListId = resultSet2.getLong(
					"CPConfigurationListId");

				if (createdCPConfigurationEntries.contains(
						cpConfigurationListId)) {

					continue;
				}

				createdCPConfigurationEntries.add(cpConfigurationListId);

				Date date = new Date();
				String uuid = PortalUUIDUtil.generate();

				insertPreparedStatement.setLong(1, 0);
				insertPreparedStatement.setLong(2, 0);
				insertPreparedStatement.setString(3, uuid);
				insertPreparedStatement.setString(4, uuid);
				insertPreparedStatement.setLong(5, increment());
				insertPreparedStatement.setLong(
					6, templateCPConfigurationEntry.getCompanyId());
				insertPreparedStatement.setLong(
					7, templateCPConfigurationEntry.getUserId());
				insertPreparedStatement.setString(
					8, templateCPConfigurationEntry.getUserName());
				insertPreparedStatement.setDate(
					9, new java.sql.Date(date.getTime()));
				insertPreparedStatement.setDate(
					10, new java.sql.Date(date.getTime()));
				insertPreparedStatement.setLong(11, cpDefinitionClassNameId);
				insertPreparedStatement.setLong(12, classPK);
				insertPreparedStatement.setLong(13, cpConfigurationListId);
				insertPreparedStatement.setLong(
					14, templateCPConfigurationEntry.getCPTaxCategoryId());
				insertPreparedStatement.setString(
					15,
					templateCPConfigurationEntry.getAllowedOrderQuantities());
				insertPreparedStatement.setBoolean(
					16, templateCPConfigurationEntry.isBackOrders());
				insertPreparedStatement.setString(
					17,
					templateCPConfigurationEntry.
						getCPDefinitionInventoryEngine());
				insertPreparedStatement.setDouble(
					18, templateCPConfigurationEntry.getDepth());
				insertPreparedStatement.setBoolean(
					19, templateCPConfigurationEntry.isDisplayAvailability());
				insertPreparedStatement.setBoolean(
					20, templateCPConfigurationEntry.isDisplayStockQuantity());
				insertPreparedStatement.setBoolean(
					21, templateCPConfigurationEntry.isFreeShipping());
				insertPreparedStatement.setDouble(
					22, templateCPConfigurationEntry.getHeight());
				insertPreparedStatement.setString(
					23, templateCPConfigurationEntry.getLowStockActivity());
				insertPreparedStatement.setBigDecimal(
					24, templateCPConfigurationEntry.getMaxOrderQuantity());
				insertPreparedStatement.setBigDecimal(
					25, templateCPConfigurationEntry.getMinOrderQuantity());
				insertPreparedStatement.setBigDecimal(
					26, templateCPConfigurationEntry.getMinStockQuantity());
				insertPreparedStatement.setBigDecimal(
					27,
					templateCPConfigurationEntry.getMultipleOrderQuantity());
				insertPreparedStatement.setBoolean(
					28, templateCPConfigurationEntry.isPurchasable());
				insertPreparedStatement.setBoolean(
					29, templateCPConfigurationEntry.isShippable());
				insertPreparedStatement.setDouble(
					30, templateCPConfigurationEntry.getShippingExtraPrice());
				insertPreparedStatement.setBoolean(
					31, templateCPConfigurationEntry.isShipSeparately());
				insertPreparedStatement.setBoolean(
					32, templateCPConfigurationEntry.isTaxExempt());
				insertPreparedStatement.setBoolean(33, true);
				insertPreparedStatement.setDouble(
					34, templateCPConfigurationEntry.getWeight());
				insertPreparedStatement.setDouble(
					35, templateCPConfigurationEntry.getWidth());
				insertPreparedStatement.setLong(
					36,
					templateCPConfigurationEntry.
						getCommerceAvailabilityEstimateId());
				insertPreparedStatement.setLong(
					37, templateCPConfigurationEntry.getGroupId());

				insertPreparedStatement.addBatch();
			}

			insertPreparedStatement.executeBatch();
		}
	}

	private void _addCPConfigurationLists(
			CPConfigurationList masterCPConfigurationList,
			PreparedStatement preparedStatement)
		throws PortalException, SQLException {

		long currentClassPK = 0;
		String currentType = StringPool.BLANK;
		boolean monoType = true;
		List<Set<String>> monoTypeList = new ArrayList<>();
		List<Set<String>> multiTypeList = new ArrayList<>();
		Set<String> typeSet = new HashSet<>();

		ResultSet resultSet = preparedStatement.executeQuery();

		while (resultSet.next()) {
			long classPK = resultSet.getLong("classPK");
			long resourceId = resultSet.getLong("resourceId");
			String type = resultSet.getString("type_");

			if (classPK != currentClassPK) {
				if (monoType) {
					monoTypeList.add(typeSet);
				}
				else {
					multiTypeList.add(typeSet);
				}

				currentClassPK = classPK;
				currentType = type;
				monoType = true;
				typeSet = new HashSet<>();
			}

			if (!type.equals(currentType) && monoType) {
				monoType = false;
			}

			typeSet.add(type + resourceId);
		}

		if (monoType) {
			monoTypeList.add(typeSet);
		}
		else {
			multiTypeList.add(typeSet);
		}

		_clearList(monoTypeList);
		_clearList(multiTypeList);

		Calendar calendar = Calendar.getInstance();

		List<Set<String>> typeList = new ArrayList<>();

		typeList.addAll(monoTypeList);
		typeList.addAll(multiTypeList);

		for (Set<String> currentSet : typeList) {
			if (currentSet.isEmpty()) {
				continue;
			}

			CPConfigurationList cpConfigurationList =
				_cpConfigurationListLocalService.addCPConfigurationList(
					null, masterCPConfigurationList.getGroupId(),
					masterCPConfigurationList.getUserId(),
					masterCPConfigurationList.getCPConfigurationListId(), false,
					masterCPConfigurationList.getName() + "_bho",
					masterCPConfigurationList.getPriority(),
					calendar.get(Calendar.MONTH),
					calendar.get(Calendar.DAY_OF_MONTH),
					calendar.get(Calendar.YEAR),
					calendar.get(Calendar.HOUR_OF_DAY),
					calendar.get(Calendar.MINUTE), 0, 0, 0, 0, 0, true);

			for (String type : currentSet) {
				long resourceId = GetterUtil.getLong(type.substring(1));

				if (type.startsWith("A")) {
					_cpConfigurationListRelLocalService.addCPConfigurationListRel(cpConfigurationList.getUserId(),
						AccountGroup.class.getName(), resourceId, cpConfigurationList.getCPConfigurationListId());
				}
				else if (type.startsWith("C")) {
					ServiceContext serviceContext = new ServiceContext();

					serviceContext.setCompanyId(cpConfigurationList.getCompanyId());
					serviceContext.setUserId(cpConfigurationList.getUserId());

					_commerceChannelRelLocalService.addCommerceChannelRel(CPConfigurationList.class.getName(),
						cpConfigurationList.getCPConfigurationListId(), resourceId, serviceContext);
				}
			}
		}
	}

	private void _clearList(List<Set<String>> list) {
		for (int i = 0; i < list.size(); i++) {
			Set<String> set1 = list.get(i);

			if (set1.isEmpty()) {
				continue;
			}

			for (int j = 0; j < list.size(); j++) {
				if (j == i) {
					continue;
				}

				Set<String> set2 = list.get(j);

				if (set2.isEmpty()) {
					continue;
				}

				if (set2.containsAll(set1)) {
					list.set(i, new HashSet<>());

					break;
				}

				if (set1.containsAll(set2)) {
					list.set(j, new HashSet<>());

					break;
				}
			}
		}
	}

	private void _updateMasterCPConfigurationEntries(
			long cpDefinitionClassNameId, long groupId,
			CPConfigurationList masterCPConfigurationList,
			PreparedStatement preparedStatement)
		throws Exception {

		preparedStatement.setBoolean(1, false);
		preparedStatement.setLong(2, cpDefinitionClassNameId);
		preparedStatement.setLong(
			3, masterCPConfigurationList.getCPConfigurationListId());
		preparedStatement.setLong(4, groupId);
		preparedStatement.setLong(5, cpDefinitionClassNameId);
		preparedStatement.setLong(
			6, masterCPConfigurationList.getCPConfigurationListId());
		preparedStatement.setLong(7, groupId);

		preparedStatement.executeUpdate();
	}

}