'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCheckoutStore,
  useCheckoutActions,
  useShippingAddress,
  useCheckoutEmail,
} from '@/stores/checkout.store';

const shippingSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().optional(),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  zip: z.string().min(1, 'ZIP/Postal code is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
];

export function ShippingForm() {
  const email = useCheckoutEmail();
  const shippingAddress = useShippingAddress();
  const { setEmail, setPhone, setShippingAddress, nextStep } = useCheckoutActions();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      email: email || '',
      phone: '',
      firstName: shippingAddress?.firstName || '',
      lastName: shippingAddress?.lastName || '',
      company: shippingAddress?.company || '',
      address1: shippingAddress?.address1 || '',
      address2: shippingAddress?.address2 || '',
      city: shippingAddress?.city || '',
      province: shippingAddress?.province || '',
      country: shippingAddress?.country || 'US',
      zip: shippingAddress?.zip || '',
    },
  });

  const selectedCountry = watch('country');

  const onSubmit = (data: ShippingFormData) => {
    setEmail(data.email);
    if (data.phone) setPhone(data.phone);
    
    setShippingAddress({
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      province: data.province,
      provinceCode: data.province,
      country: data.country,
      countryCode: data.country,
      zip: data.zip,
      phone: data.phone,
    });

    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone (for delivery updates)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register('phone')}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className="mt-1"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className="mt-1"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              {...register('company')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address1">Address *</Label>
            <Input
              id="address1"
              placeholder="Street address"
              {...register('address1')}
              className="mt-1"
            />
            {errors.address1 && (
              <p className="text-sm text-destructive mt-1">{errors.address1.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
            <Input
              id="address2"
              placeholder="Apt, Suite, Unit, etc."
              {...register('address2')}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city')}
                className="mt-1"
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="province">State/Province *</Label>
              <Input
                id="province"
                {...register('province')}
                className="mt-1"
              />
              {errors.province && (
                <p className="text-sm text-destructive mt-1">{errors.province.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => setValue('country', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive mt-1">{errors.country.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="zip">ZIP/Postal Code *</Label>
              <Input
                id="zip"
                {...register('zip')}
                className="mt-1"
              />
              {errors.zip && (
                <p className="text-sm text-destructive mt-1">{errors.zip.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        Continue to Delivery
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}
