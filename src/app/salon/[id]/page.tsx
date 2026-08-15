import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getSalonById } from '@/actions/salon.actions';
import { Header } from '@/components/shared/Header';
import SalonSidebar from '@/components/features/SalonSidebar';
import SalonAboutMap from '@/components/features/SalonAboutMap';
import {
  Share, Heart, ChevronRight, Star,
  BadgeCheck, Check, CreditCard
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string; locale?: string }>;
}
export default async function SalonDetailPage({ params }: PageProps) {
  console.log("=== ID Received ===", params); // این خط را اضافه کنید

  const resolvedParams = await params;
  const salonId = resolvedParams.id;
  const salon = await getSalonById(salonId);
  if (!salon) {
    console.log("=== Salon Not Found in DB ===");
    notFound();
  }

  const reviewsCount = salon.reviews?.length || 0;
  const averageRating = reviewsCount > 0
    ? (salon.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : '۵.۰';

  return (
    <main className="min-h-screen bg-white pb-20">
      <Header hasSearch={true} />

      <div className="pt-24 md:pt-28 max-w-[1200px] mx-auto px-4">

        <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
          <span className="hover:underline cursor-pointer">خانه</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:underline cursor-pointer">آرایشگاه‌ها</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">{salon.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{salon.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-gray-700">
              <span className="font-bold text-gray-900">{averageRating}</span>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-purple-600 hover:underline cursor-pointer">({reviewsCount})</span>
              <span className="text-gray-400 mx-1">•</span>
              <span>{salon.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2.5 bg-white rounded-full border border-gray-200 hover:border-gray-900 transition-colors">
              <Share className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2.5 bg-white rounded-full border border-gray-200 hover:border-gray-900 transition-colors">
              <Heart className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 h-[400px] md:h-[450px] mb-10 rounded-2xl overflow-hidden">
          <div className="md:col-span-2 relative h-full w-full bg-gray-100 group cursor-pointer overflow-hidden">
            <Image
              src={salon.portfolio?.[0]?.imageUrl || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2070&auto=format&fit=crop"}
              alt="نمای اصلی سالن"
              fill
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="hidden md:flex flex-col gap-2 md:gap-3 h-full">
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <Image
                src={salon.portfolio?.[1]?.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop"}
                alt="جزئیات سالن ۱"
                fill
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <Image
                src={salon.portfolio?.[2]?.imageUrl || "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop"}
                alt="جزئیات سالن ۲"
                fill
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
              />
              <button className="absolute bottom-4 left-4 md:right-4 md:left-auto bg-white text-gray-900 px-4 py-2 rounded-full text-[14px] font-semibold shadow-md hover:bg-gray-50 transition-colors z-10 border border-gray-200">
                مشاهده همه تصاویر
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative items-start">
          <div className="flex-1 w-full lg:max-w-[calc(100%-380px)]">

            <h2 className="text-2xl font-bold text-gray-900 mb-6">خدمات</h2>
            <div className="space-y-4 mb-6">
              {salon.services?.length > 0 ? (
                salon.services.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-[16px] font-medium text-gray-900">{service.name}</h3>
                        <p className="text-[14px] text-gray-500 mt-1">{service.durationMin} دقیقه</p>
                        <div className="flex items-center gap-2 mt-3 text-[14px]">
                          <span className="font-semibold text-gray-900">{service.price.toLocaleString('fa-IR')} تومان</span>
                        </div>
                      </div>
                      <button className="px-6 py-2 rounded-full border border-gray-300 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                        رزرو
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">خدماتی برای این سالن ثبت نشده است.</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-8 mt-12">
              <h2 className="text-2xl font-bold text-gray-900">تیم (Team)</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 mb-16">
              {salon.teamMembers?.map((member) => (
                <div key={member.id} className="flex flex-col items-center group cursor-pointer">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gray-200 transition-colors relative">
                      <Image
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mt-2">{member.name}</h4>
                  <p className="text-[13px] text-gray-500 mt-0.5">{member.role || 'عضو تیم'}</p>
                </div>
              ))}
            </div>

            <hr className="border-gray-100 mb-12" />

            <div className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">نظرات (Reviews)</h2>

              <div className="flex flex-col mb-10">
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current" />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[15px]">
                  <span className="font-bold text-lg text-gray-900">{averageRating}</span>
                  <span className="text-purple-600 hover:underline cursor-pointer">({reviewsCount})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-8">
                {salon.reviews?.map((review) => (
                  <div key={review.id} className="flex flex-col text-right">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-purple-100 text-purple-700">
                        {review.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-gray-900">{review.user?.name || 'کاربر ناشناس'}</span>
                        <span className="text-[13px] text-gray-500 mt-0.5">
                          {/* تغییر از review.createdAt به review.date */}
                          {new Date(review.date).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-yellow-400 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>

                    <p className="text-[15px] text-gray-800 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100 mb-12" />

            <SalonAboutMap
              description={salon.description || 'توضیحاتی برای این سالن ثبت نشده است.'}
              location={{
                address: salon.address,
                lat: 35.6892,
                lng: 51.3890,
                rating: Number(averageRating) // اضافه کردن پراپرتی اجباری rating
              }}
            />

            <div className="mt-10 mb-16">
              <h3 className="text-xl font-bold text-gray-900 mb-6">اطلاعات تکمیلی</h3>
              <ul className="space-y-4 grid grid-cols-1 md:grid-cols-2">
                <li className="flex items-center gap-3 text-[15px] text-gray-900">
                  <BadgeCheck className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>کسب‌وکار تایید شده</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-gray-900">
                  <Check className="w-5 h-5 text-gray-500 shrink-0" />
                  <span>تایید فوری (Instant confirmation)</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-gray-900">
                  <CreditCard className="w-5 h-5 text-gray-500 shrink-0" />
                  <span>پرداخت امن</span>
                </li>
              </ul>
            </div>
          </div>

          <SalonSidebar salon={salon} />

        </div>
      </div>
    </main>
  );
}
