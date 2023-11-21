import React, { Fragment, HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from 'src/components/shared/Card';
import Image from 'src/components/shared/Image';
import LoadingComponent from 'src/components/shared/LoadingComponent';
import axiosInstance from 'src/helper/AxiosInstance';
import CurrencyFormatter from 'src/helper/CurrencyFormatter';
import { Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper.css';
import { DisplayProductFields } from './create';
import useForm from 'src/hooks/useForm';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { AxiosError } from 'axios';
import Select from 'src/components/shared/Select';
import Alert from 'src/components/shared/Alert';
import { Icon } from '@iconify/react';
import Editor from 'src/components/shared/Editor';
import Modal from 'src/components/shared/Modal';

function useHook() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<any>({});
  const [shipping,setShipping] = useState([])
  useEffect(() => {
    GetProductDetails();
  }, []);

  async function GetProductDetails() {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get('products/v1/' + id);
      setProduct(data.product);
      setShipping(data.shipping)
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, product,shipping };
}
interface ProductForm {
  name: string;
  description: string;
  price: number;
  main_price: number;
  quantity: number;
  sku: string;
  images: any[] | null;
  options: any[] | null;
  metadata_title: string;
  metadata_description: string;
  merchant: undefined;
  skus: string[];
}
export default function id() {
  const { isLoading, product,shipping } = useHook();
  const [edit,setEdit] = useState(false)
  const [errors, setErrors] = useState<any>();
  const [initialValues, setInitialValues] = useState<ProductForm>(product);
  const [visible, setVisible] = useState<boolean>(false);
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [result, setResult] = useState<any>();
  const { user } = useSelector((state: RootState) => state.auth);

  const {
    formik: { handleSubmit, handleChange, values, setFieldValue }
  } = useForm({ initialValues, submitHandler: updateProduct });

  const GetPriceFromCommission =  useMemo(() => {
    let total: number = 0,
      quantities: number = 0;
    const { vendor_commission } = values;
    total = product.main_price
    
    const commissionPrice = total * ((vendor_commission || 0) / 100);
    const price = parseFloat((total + commissionPrice).toFixed(2));
  
    setFieldValue('price', price);
    return commissionPrice;
  }, [product.vendor_commission, values.vendor_commission]);


  async function updateProduct(values:any){
    try{
    setDisabled(true);
    setErrors(undefined);
    const { data } = await axiosInstance.post(`products/v1/update`, values);
    setResult(data?.result?.urls);
    setVisible(true);
  } catch (error: AxiosError | any) {
    const err = error.response;
    const _errors = err?.data?.message?.error?.fields;

    if (_errors) return setErrors(Object.values(_errors));
    setErrors(err?.data?.message);
  } finally {
    setDisabled(false);
  }
  }
  useEffect(() => {
    if (user?.userType === 'admin') {
      GetUsers();
    }
  }, []);

  async function GetUsers() {
    try {
      const { data } = await axiosInstance.get('auth/users', { params: { userType: 'vendor' } });
      setUsers(data);
      console.log(product)
    } catch (error) {
      console.log(error);
    }
  }

  
  const removeOption = useCallback(
    (id: string | number) => {
      const result = values.options.filter((e: any, index: number | string) => index !== id);
      setFieldValue('options', result);
    },
    [values.options]
  );

  const removeValue = useCallback(
    (value: string | number, option: string | number) => {
      const result = values.options.map((e: any, index: number | string) => {
        const isSame = index == option;
        const values = e.values.filter((v: any, idx: number | string) => idx !== value);
        if (isSame) {
          return {
            ...e,
            values
          };
        }
        return e;
      });

      setFieldValue('options', result);
    },
    [values.options]
  );

  const TogglePage = (check:boolean)=>{
    if(check){
      setInitialValues(product)
      setEdit(true)
      console.log(product)
    }else{
      setEdit(false)
      window.location.reload()
    }
    
  }
  const getEiring = (shipCost:number)=>{
    if(product)  return GetPriceFromCommission -  (shipCost + (0.07 * (product.main_price + shipCost)))
    else return 0
     
    
 
  }

  if (isLoading) return <LoadingComponent />;


  return (
    <div className="p-8 pt-2 space-y-4">
      <div className='flex w-full justify-end'>
        {edit ?
         <button className='text-gray-700 border-2 border-gray-200 px-5 py-2 rounded-md hover:scale-105' onClick={()=>TogglePage(false)}>Cancel</button> :
          <button className='text-gray-700 border-2 border-gray-200 px-5 py-2 rounded-md hover:scale-105' onClick={()=>TogglePage(true)}>Edit</button>}
      </div>
          {edit ? 
          <>
          
               <form
               className="space-y-4"
               onSubmit={handleSubmit}
             >
               <div className="flex items-start gap-4">
                 {/* <Card className="w-full max-w-sm shrink-0"></Card> */}
                 <div className="flex-1 space-y-4 shrink-0">
                   {errors ? <Alert content={JSON.stringify(errors, null, 2)} /> : null}
                   <Card className="space-y-4">
                     {user?.userType === 'admin' ? (
                       <div className="form-group">
                         <label className="form-label">Vendor</label>
       
                         <Select
                           type="single"
                           optionTxt="name"
                           optionValue="id"
                           value={values?.merchant}
                           onSelect={(val) => setFieldValue('merchant', val)}
                           options={users}
                         />
                         {errors?.merchant ? <span className="form-error">{errors?.merchant}</span> : null}
                       </div>
                     ) : null}
                     <div className="form-group">
                       <label className="form-label">Name</label>
                       <input
                         type="text"
                         id="name"
                         autoComplete="off"
                         className="form-input"
                         placeholder="..."
                         value={values?.name}
                         name="name"
                         onChange={handleChange}
                         required
                       />
                       {errors?.name ? <span className="form-error">{errors?.name}</span> : null}
                     </div>
                     <div className="form-group">
                       <label className="form-label">SKU</label>
                       <input
                         type="text"
                         id="sku"
                         autoComplete="off"
                         className="form-input"
                         placeholder={values?.sku}
                         name="sku"
                         disabled
                         readOnly
                         required
                       />
                       {errors?.sku ? <span className="form-error">{errors?.sku}</span> : null}
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="form-group sm:col-span-2">
                         <label className="form-label">Commission (%)</label>
                         <input
                           type="number"
                           id="vendor_commission"
                           autoComplete="off"
                           className="form-input"
                           placeholder="..."
                           value={values?.vendor_commission}
                           name="vendor_commission"
                           onChange={handleChange}
                           min={0}
                           max={1000}
                           step="any"
                           required
                         />
                             <p className="text-gray-500 text-sm">
                    The earning from this product based on selected options value price{' '}
                    <span className="text-teal-600">{JSON.stringify(values.value_skus)}</span> as
                    default will be{' '}
                    <span className="text-teal-600">
                      {CurrencyFormatter(GetPriceFromCommission)}
                    </span>{' '}
                    <span className='text-red-600 text-xs'> ( Not Including VAT and Shipping cost )</span>
                  </p>
                         {errors?.vendor_commission ? (
                           <span className="form-error">{errors?.vendor_commission}</span>
                         ) : null}
                       </div>
                       <div className="form-group">
                         <label className="form-label">Price (SAR)</label>
                         <input
                           type="number"
                           id="price"
                           autoComplete="off"
                           className="form-input"
                           placeholder={values?.price}
                           name="price"
                           disabled
                           readOnly
                           required
                         />
                         {errors?.price ? <span className="form-error">{errors?.price}</span> : null}
                       </div>
       
                       <div className="form-group">
                         <label className="form-label">Quantity</label>
                         <input
                           type="number"
                           id="quantity"
                           autoComplete="off"
                           className="form-input"
                           placeholder={values?.quantity}
                           name="quantity"
                           disabled
                           readOnly
                           required
                         />
                         {errors?.quantity ? <span className="form-error">{errors?.quantity}</span> : null}
                       </div>
                     </div>
                   </Card>
       
                   <Card className="space-y-4">
                     <p className="text-lg font-semibold text-content">Options</p>
                     {values?.options?.map((option: any, index: number) => {
                       return (
                         <div
                           className="space-y-3"
                           key={'option-' + index}
                         >
                           <div className="flex items-center gap-4 justify-between">
                             <p className="text-sm text-gray-600">{option.name}</p>
                           </div>
                           <ul className="grid grid-wrapper gap-2">
                             {option.values.map((val: any, idx: number) => (
                               <li
                                 key={'value-' + index + '-' + idx}
                                 className="py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer flex-[fit-content]"
                               >
                                 <div className="flex gap-4 items-center">
                                   <div className="flex-1">
                                     <div className="flex items-start gap-2 justify-between">
                                       <p className="text-sm font-semibold">{val.name}</p>
                                       <p className="text-sm font-semibold">{val.quantity || 0} (QTY)</p>
                                     </div>
                                     <p className="text-xs text-gray-600">
                                       <span>{CurrencyFormatter(val.price)}</span>{' '}
                                       {val.price !== val.original_price && (
                                         <span className="text-red-500 line-through">
                                           {CurrencyFormatter(val.original_price)}
                                         </span>
                                       )}
                                     </p>
                                   </div>
                                 </div>
                               </li>
                             ))}
                           </ul>
                         </div>
                       );
                     })}
                   </Card>
                      {
                shipping.length ?   <Card className="space-y-4">
                <p className="text-lg font-semibold text-content">Shipping</p>
                <div className='grid grid-cols-1 lg:grid-cols-2  gap-x-5 items-center justify-around gap-y-5'>

                
                {shipping?.map((option: any, index: number) => {
                  return (
                    <div style={{border:'2px solid #d1c2c2'}}
                      className=" flex  flex-col border-gray-500  rounded-lg  gap-y-3"
                      key={'option-' + index}
                    >
                      {
                            option.service_name === 'CAINIAO_CONSOLIDATION_SA'  ?
                            <span className='text-white bg-red-500 w-full  text-xs px-3 py-2 rounded-t-lg text-center'> Recommend </span> : null
                          }
                      <div className='flex w-full justify-between items-center px-2 pt-2 '>
                          <div className='flex items-center gap-x-2'>
                            {option.service_name === 'CAINIAO_CONSOLIDATION_SA'  ?<>
                            <p className={`text-sm text-gray-600 `} >AliExpress Direct</p>
                            </>  : option.service_name ===  'CAINIAO_STANDARD' ?<>
                              <p className={`text-sm text-gray-600 `} >AliExpress Standard Shipping</p></>  :  <p className={`text-sm text-gray-600 `} > { option.service_name }</p>}
                           
                          </div>
                          <p className="text-xs  text-red-500">{CurrencyFormatter(option.freight.amount)}</p>
                      </div>
                        <p className="text-xs px-2">Esimated Delivery Days : <span className='text-teal-600'>{option.estimated_delivery_time}</span></p>     
                        <p className="text-xs px-2 mb-4">Earning from this product based on this shipping methode and 7% VAT will be <span className='text-teal-600'>SAR {getEiring(option.freight.amount)}</span> </p>     
                    </div>
                  );
                })}
                </div>
              </Card>
                 : <div className='flex justify-center items-center text-red-700'>Product Shipping Not Avaliable</div>
              }
                   <Card className="space-y-4">
                     <p className="text-lg font-semibold text-content">Images</p>
                     <ul className="grid grid-wrapper gap-4">
                       {values?.images?.map((image: any, i: number) => (
                         <DisplayImage
                           item={image}
                           key={i}
                           index={i}
                           onChange={({ target }: any) => {
                             setFieldValue(
                               'images',
                               values?.images?.map((ev: any, idx: number) => {
                                 return {
                                   ...ev,
                                   default: idx === i ? true : false
                                 };
                               })
                             );
                           }}
                         />
                       ))}
                     </ul>
                   </Card>
       
                   <Card className="space-y-4">
                     <p className="text-lg font-semibold text-content">SEO Settings</p>
                     <div className="form-group">
                       <label className="form-label">SEO title</label>
                       <input
                         type="text"
                         autoComplete="off"
                         className="form-input"
                         placeholder="..."
                         value={values?.metadata_title}
                         name="metadata_title"
                         onChange={handleChange}
                         required
                         maxLength={70}
                       />
                       {errors?.metadata_title ? (
                         <span className="form-error">{errors?.metadata_title}</span>
                       ) : null}
                     </div>
                     <div className="form-group">
                       <label className="form-label">SEO description</label>
                       <textarea
                         autoComplete="off"
                         className="form-input"
                         placeholder="..."
                         value={values?.metadata_description}
                         name="metadata_description"
                         onChange={handleChange}
                         required
                         maxLength={150}
                       ></textarea>
                       {errors?.metadata_description ? (
                         <span className="form-error">{errors?.metadata_description}</span>
                       ) : null}
                     </div>
                   </Card>
                 </div>
               </div>
               <div className="w-full bottom-0 sticky z-10 bg-white p-4 border-t border-t-gray-200">
                 <div className="inline-flex gap-3 flex-wrap">
                   <button
                     className="btn-with-icon bg-secondary !text-sm"
                     type="submit"
                     disabled={disabled}
                   >
                     <span>Save changes</span>
                   </button>
                 </div>
               </div>
             </form>
             <Modal
        visible={visible}
        handleClose={() => setVisible(false)}
        title="Congratulations"
      >
        <Fragment>
        <div className="space-y-6">
            <p className="text-sm font-medium text-gray-600">
              The product has been updated to the store under the name{' '}
              <span className="font-bold text-teal-600">{values?.name}</span> You can continue
              updating the rest of the products or visit the product through one of the following
              links
            </p>
            <div>
              <div className="inline-flex gap-2 items-center flex-wrap">
                <Link
                  to={result?.customer}
                  className="btn-with-icon bg-secondary"
                >
                  <span>View product in store</span>
                </Link>
                <Link
                  to={result?.admin}
                  className="btn-with-icon outline-btn text-gray-600"
                >
                  <span>View product in dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="btn-with-icon outline-btn text-gray-600"
                >
                  <span>Keep creating</span>
                </button>
              </div>
            </div>
          </div>
        </Fragment>
      </Modal>
          </>
          :<div className="w-full flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:max-w-sm grid">
          <Card className="w-full">
            <Swiper
              autoHeight
              autoplay={{ delay: 5000 }}
              modules={[Autoplay]}
              slidesPerView={1}
            >
              {product.images?.map((image: any, index: number) => (
                <SwiperSlide key={index}>
                  <Image
                    src={image.original}
                    className="w-full"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </Card>
        </div>
        <div className="w-full space-y-4 flex-1 grid">
          <Card>
            <p className="text-2xl font-bold text-title">{product.name}</p>

            <div className=" py-4 border-y border-y-gray-200 !my-6">
              <ul className="w-full max-w-xs grid grid-cols-2 gap-2">
                <li>
                  <p className="text-sm text-gray-500">SKU</p>
                </li>
                <li>
                  <p className="text-sm text-title">{product.sku}</p>
                </li>
                <li>
                  <p className="text-sm text-gray-500">Main price</p>
                </li>
                <li>
                  <p className="text-sm text-title">{CurrencyFormatter(product.main_price)}</p>
                </li>
                <li>
                  <p className="text-sm text-gray-500">Price</p>
                </li>
                <li>
                  <p className="text-sm text-title">{CurrencyFormatter(product.price)}</p>
                </li>
                <li>
                  <p className="text-sm text-gray-500">Commission</p>
                </li>
                <li>
                  <p className="text-sm text-title">
                    {product.vendor_commission}% {CurrencyFormatter(product.vendor_price)}
                  </p>
                </li>
                <li>
                  <p className="text-sm text-gray-500">Quantity</p>
                </li>
                <li>
                  <p className="text-sm text-title">{product.quantity}</p>
                </li>
                <li>
                  <p className="text-sm text-gray-500">Original product</p>
                </li>
                <li>
                  <Link
                    to={'https://aliexpress.com/item/' + product.original_product_id + '.html'}
                    className="text-xs font-medium bg-primary text-white rounded py-2 px-4"
                  >
                    View AE product
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              {product?.options?.map((option: any, index: number) => (
                <div
                  className="space-y-3"
                  key={index}
                >
                  <p className="text-title font-semibold">{option.name}</p>
                  <ul className="flex items-center flex-wrap gap-2">
                    {option.values?.map((value: any, idx: number) => (
                      <li
                        className="shrink-0"
                        key={idx}
                      >
                        <p className="text-sm font-medium text-gray-600 bg-gray-100 rounded py-2 px-4">
                         {value && <> {value.name}{' '}
                          {value.original_price !== value.price ? (
                            <span className="line-through text-gray-400">
                              {CurrencyFormatter(value.original_price)}
                            </span>
                          ) : null}{' '} 
                          
                          <span>{CurrencyFormatter(value.price)}</span>
                          </>}
                       
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div
              className="text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: product.description }}
            ></div>
          </Card>
        </div>
      </div> }
      
    </div>
  );
}


function DisplayImage({
  item,
  index,
  ...other
}: { item: any; index: number } & HTMLAttributes<HTMLInputElement>) {
  return (
    <li>
      <Card className="space-y-4 flex flex-col w-full h-full">
        <Image
          src={item?.original}
          className="w-full flex-1 rounded-xl object-center"
        />
        <div>
          <div className="inline-flex gap-3 items-center">
            <input
              type="radio"
              name="images-group"
              id={'image-group-' + index}
              className="form-radio"
              checked={item.default}
              {...other}
            />
            <label
              htmlFor={'image-group-' + index}
              className="form-label cursor-pointer"
            >
              Select as default
            </label>
          </div>
        </div>
      </Card>
    </li>
  );
}