/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayDropDown from '@clayui/drop-down';
import ClayForm, {ClayInput} from '@clayui/form';
import ClayMultiSelect from '@clayui/multi-select';
import classNames from 'classnames';
import {fetch} from 'frontend-js-web';
import React, {useRef, useCallback, useContext, useEffect, useState, useMemo} from 'react';

import {addToCart} from '../add_to_cart/data';
import MiniCartContext from './MiniCartContext';
import {getCorrectedQuantity} from './util/index';
import InfiniteScroller from "../infinite_scroller/InfiniteScroller";

const CHANNEL_RESOURCE_ENDPOINT =
	'/o/headless-commerce-delivery-catalog/v1.0/channels';





export default function CartQuickAdd() {
	const {cartState, setCartState} = useContext(MiniCartContext);

	const [formattedProducts, setFormattedProducts] = useState([]);
	const [productsQuery, setProductsQuery] = useState('');
	const [quantityError, setQuantityError] = useState(false);
	const [quickAddToCartError, setQuickAddToCartError] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState([]);
	const [productsWithOptions, setProductsWithOptions] = useState([]);

	//const [loading, setLoading] = useState(false);


	const loading = useRef(false);

	const {cartItems = [], channel} = cartState;
	const accountId = cartState.accountId;
	const channelId = channel.channel.id;

	const totalCount = useRef(0);
	const itemLength = useRef(0);
	const lastPage = useRef(1);
	const [page, setPage] = useState(false);

	const timer = useRef(null);


	const never = false;



	useEffect(() => {
		if (page > 1) {
			console.error("useEffect", page);
			ciccio2(productsQuery, true);
		}
	}, [page]);

	/*useEffect(() => {
		if (productsQuery.length) {
			console.error("useEffect query", productsQuery);
			ciccio2(productsQuery, false);
		}
	}, [productsQuery]);*/

	function Test(props) {
		console.error("test", props.formattedProducts.length);
		return (
			<ClayDropDown.ItemList>

				{props.formattedProducts.map((product) => {
					console.error("mappoooo");
					const {id, label, value} = product;

					const purchasableProduct = product.sku
						? product.purchasable
						: product.skus[0].purchasable;


					if (
						!selectedProducts.includes(product) &&
						purchasableProduct
					) {
						return (
							<ClayDropDown.Item
								key={id}
								onClick={() => props.onItemClick(product)}
							>
								<div className="autofit-row autofit-row-center">
									<div className="autofit-col mr-3 w-25">{value}</div>

									<span className="ml-2 text-truncate-inline">
							<span className="text-truncate">{label}</span>
						</span>
								</div>
							</ClayDropDown.Item>
						);}
				})}
			</ClayDropDown.ItemList>
		)
	}

	const Test2 = React.memo(props => {
		//console.error(props);
		return (
			<InfiniteScroller
				onBottomTouched={() => {
					console.error("infinite down");
					if (!loading.current) {
						console.error("infinite down loading");
						loading.current = true;
						setPage((currentPage) =>
							currentPage < lastPage.current
								? currentPage + 1
								: currentPage
						);

					}
				}}
				scrollCompleted={itemLength.current >= totalCount.current}
			>
				<Test formattedProducts={props.sourceItems} onItemClick={props.onItemClick} />
			</InfiniteScroller>
		);
	}, (prevProps, nextProps) => true);

	const ProductAutocompleteList = ({onItemClick, sourceItems}) => {
		console.error("qui", loading.current);

		return (
			<InfiniteScroller
				onBottomTouched={() => {
					console.error("infinite down");
					if (!loading.current) {
						console.error("infinite down loading");
						loading.current = true;
						setPage((currentPage) =>
							currentPage < lastPage.current
								? currentPage + 1
								: currentPage
						);

					}
				}}
				scrollCompleted={itemLength.current >= totalCount.current}
			>
				<Test formattedProducts={sourceItems} onItemClick={onItemClick} />
			</InfiniteScroller>

	)}

	const ciccio1 = (queryString) => {

		console.error("ciccio1", queryString);
		setProductsQuery(queryString);

		console.error(timer.current);

		clearTimeout(timer.current);

		console.error(timer.current);

		timer.current = setTimeout(() => {



			setPage(1);

			ciccio2(queryString, false);
		}, 500);


	}

	const test = [true];

	const prova = useCallback(() => {
		console.error("source");

		return test;
	}, [never]);


	const prepareProductsApiURL = (page, search) => {
		return new URL(
			`${themeDisplay.getPathContext()}${CHANNEL_RESOURCE_ENDPOINT}/${channelId}/products?accountId=${accountId}&nestedFields=skus&pageSize=10&page=${page}&skus.accountId=${accountId}&search=${search}`,
			themeDisplay.getPortalURL()
		).toString();
	}


	const ciccio2 = (queryString, append) => {

		console.error("ciccio2", queryString);

		if (!queryString.length) {
			setFormattedProducts([]);

			setProductsWithOptions(
				[]
			);
			loading.current = false;
			return;
		}

		let urlString = prepareProductsApiURL(page, queryString);

		loading.current = true;

		fetch(urlString)
			.then((response) => response.json())
			.then((availableProducts) => {

				let formattedProducts2 = [];

				totalCount.current = availableProducts.totalCount;
				itemLength.current = availableProducts.page * availableProducts.pageSize;
				lastPage.current = availableProducts.lastPage;

				availableProducts.items.forEach((product) => {
					const {name, skus} = product;

					if (product.skus.length > 1) {
						product.skus.forEach((sku) =>
							formattedProducts2.push({
								...sku,
								chipLabel: sku.sku,
								label: name,
								value: sku.sku,
							})
						);
					}
					else {
						formattedProducts2.push({
							...product,
							chipLabel: skus[0].sku,
							label: name,
							value: skus[0].sku,
						});
					}
				});

				console.error("ciccio2 - preformat");

				if (append) {
					formattedProducts2 = formattedProducts.concat(formattedProducts2);
				}

				setFormattedProducts(formattedProducts2);

				setProductsWithOptions(
					availableProducts.items.filter(
						(product) => product.skus.length > 1
					)
				);

				loading.current = false;
			});
	};

	const handleAddToCartClick = () => {
		const readyProducts = selectedProducts.map((product) => {
			if (product.sku) {
				const parentProduct = productsWithOptions.find((item) =>
					item.skus.find((childSku) => childSku.sku === product.sku)
				);

				const {name, productConfiguration, urls} = parentProduct;

				const adjustedQuantity = getCorrectedQuantity(
					product,
					product.sku,
					cartItems,
					parentProduct
				);

				return {
					...product,
					name,
					price: product.price,
					productURLs: urls,
					quantity: adjustedQuantity,
					settings: productConfiguration,
					sku: product.sku,
					skuId: product.id,
					skuOptions: product.DDMOptions,
				};
			}
			else {
				const {productConfiguration, skus, urls} = product;

				const adjustedQuantity = getCorrectedQuantity(
					product,
					skus[0].sku,
					cartItems,
					false
				);

				return {
					...product,
					price: skus[0].price,
					productURLs: urls,
					quantity: adjustedQuantity,
					settings: productConfiguration,
					sku: skus[0].sku,
					skuId: skus[0].id,
				};
			}
		});

		const productWithoutQuantity = readyProducts.find(
			(product) => product.quantity === 0
		);

		if (!productWithoutQuantity) {
			setCartState((cartState) => ({
				...cartState,
				cartItems: cartItems.concat(readyProducts),
			}));

			addToCart(
				readyProducts,
				cartState.id,
				channel.channel.id,
				cartState.accountId
			);

			setSelectedProducts([]);
		}
		else {
			setQuickAddToCartError(true);

			setQuantityError(true);
		}
	};

	return (
		<ClayForm.Group
			className={classNames('p-3', {'has-error': quickAddToCartError})}
		>
			<ClayInput.Group>
				<ClayInput.GroupItem>
					<ClayMultiSelect
						allowsCustomLabel={false}
						className="p3"
						inputName="searchProducts"
						items={selectedProducts}
						locator={{
							label: 'chipLabel',
							value: 'value',
						}}
						menuRenderer={ProductAutocompleteList}
						onChange={ciccio1}
						onItemsChange={(newItems) => {
							setQuickAddToCartError(false);

							setQuantityError(false);

							newItems = newItems.filter((item) => {
								if (item.id) {
									return item;
								}
								else {
									setQuickAddToCartError(true);
								}
							});

							setSelectedProducts(newItems);
						}}
						onPaste={(event) => {
							const pastedText = event.clipboardData.getData(
								'Text'
							);

							event.preventDefault();

							setProductsQuery(productsQuery.concat(pastedText));
						}}
						placeholder={Liferay.Language.get('search-products')}
						size="sm"
						sourceItems={formattedProducts.filter((product) => {
							console.error("sourceItems");


							const {label, value} = product;
							const lowerCaseValue = productsQuery.toLowerCase();
							const purchasableProduct = product.sku
								? product.purchasable
								: product.skus[0].purchasable;

							if (
								!selectedProducts.includes(product) &&
								purchasableProduct
							) {
								return (
									label
										.toLowerCase()
										.includes(lowerCaseValue) ||
									value.toLowerCase().includes(lowerCaseValue)
								);
							}
						})}
						value={productsQuery}
					/>

					{quickAddToCartError && (
						<ClayForm.FeedbackGroup>
							<ClayForm.FeedbackItem>
								<ClayForm.FeedbackIndicator symbol="info-circle" />

								{`${Liferay.Language.get('error-colon')} `}

								{quantityError
									? Liferay.Language.get(
											'please-enter-a-valid-quantity'
									  )
									: Liferay.Language.get('select-from-list')}
							</ClayForm.FeedbackItem>
						</ClayForm.FeedbackGroup>
					)}
				</ClayInput.GroupItem>

				<ClayInput.GroupItem shrink>
					<ClayButtonWithIcon
						disabled={
							!selectedProducts.length || quickAddToCartError
						}
						onClick={handleAddToCartClick}
						symbol="shopping-cart"
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>
		</ClayForm.Group>
	);
}
