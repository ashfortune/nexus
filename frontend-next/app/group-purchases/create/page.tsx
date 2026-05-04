'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Image as ImageIcon, Check } from 'lucide-react';

const regionData: { [key: string]: string[] } = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
  '인천광역시': ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전북특별자치도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '진안군', '정읍시'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시'],
};

export default function GroupBuyCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    itemPrice: '',
    targetCount: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    if (selectedProvince) {
      setCities(regionData[selectedProvince]);
      setSelectedCity('');
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !selectedCity) {
      alert('지역을 선택해 주세요.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      let finalImageUrl = '';

      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('category', 'product-images');

        const uploadRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/group-purchases/files/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          finalImageUrl = data.url;
        }
      }

      const userId = localStorage.getItem('userId') || 'd38bc69d-9660-4e11-a50d-9ee90ff38673';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          region: `${selectedProvince} ${selectedCity}`,
          imageUrl: finalImageUrl,
          itemPrice: parseInt(formData.itemPrice),
          targetCount: parseInt(formData.targetCount),
          endDate: formData.endDate.includes('T') ? formData.endDate : `${formData.endDate}:00`,
        }),
      });

      if (response.ok) {
        alert('공동구매가 성공적으로 등록되었습니다!');
        router.push('/group-purchases');
      } else {
        const errorData = await response.json();
        alert(`등록 실패: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-slate-400 hover:text-[var(--nexus-primary)] font-black transition-all mb-8 uppercase tracking-widest text-xs"
          >
            <ChevronLeft className="w-5 h-5" /> Back to list
          </button>
          <span className="text-[var(--nexus-primary)] font-black tracking-[0.4em] text-[10px] uppercase mb-3 block opacity-60">Seller Center</span>
          <h1 className="text-5xl font-black text-[var(--nexus-primary)] tracking-tight">
            새로운 <span className="opacity-30">공동구매</span> 등록
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium">당신의 제안이 가치가 되도록 상세 정보를 입력해 주세요.</p>
        </header>

        <form onSubmit={handleSubmit} className="nexus-card p-16 shadow-2xl border-2 border-white space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 이미지 업로드 */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">대표 이미지 (Main Preview)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-80 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden group shadow-inner"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-black text-lg">클릭하여 이미지 업로드</p>
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">권장 사이즈: 16:9 비율</p>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            {/* 제목 */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">공동구매 제목 (Listing Title)</label>
              <input required name="title" value={formData.title} onChange={handleChange} placeholder="가장 매력적인 공동구매 제목을 지어주세요" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-8 py-6 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-[var(--nexus-primary)] transition-all font-black text-2xl placeholder:text-slate-200" />
            </div>

            {/* 상품명 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">상품명</label>
              <input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="정확한 상품명" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-bold text-lg transition-all" />
            </div>

            {/* 가격 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">판매 가격 (원)</label>
              <input required type="number" name="itemPrice" value={formData.itemPrice} onChange={handleChange} placeholder="0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-black text-lg transition-all" />
            </div>

            {/* 목표 인원 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">목표 인원 (명)</label>
              <input required type="number" name="targetCount" value={formData.targetCount} onChange={handleChange} placeholder="최소 모집 인원" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-black text-lg transition-all" />
            </div>

            {/* 마감 기한 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">모집 마감 일시</label>
              <input required type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-black text-lg transition-all [color-scheme:light]" />
            </div>

            {/* 지역 선택 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">주요 활동 지역 (시/도)</label>
              <select 
                required 
                value={selectedProvince} 
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-black text-lg appearance-none cursor-pointer transition-all"
              >
                <option value="">선택해 주세요</option>
                {Object.keys(regionData).map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">상세 지역 (시/군/구)</label>
              <select 
                required 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-[var(--nexus-primary)] font-black text-lg appearance-none cursor-pointer disabled:opacity-30 transition-all"
              >
                <option value="">선택해 주세요</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* 상세 설명 */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">상세 설명 (Story & Details)</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={8} placeholder="참여자들이 신뢰할 수 있도록 제품의 상세한 정보와 공동구매 취지를 적어주세요." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-8 focus:outline-none focus:border-[var(--nexus-primary)] font-medium text-xl resize-none transition-all placeholder:text-slate-200" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-8 rounded-[2rem] font-black text-2xl transition-all shadow-2xl flex items-center justify-center gap-4 transform active:scale-95 ${
              isSubmitting ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[var(--nexus-primary)] text-white shadow-indigo-900/30 hover:bg-[#081363]'
            }`}
          >
            {isSubmitting ? '등록 처리 중...' : (
              <>
                <Check className="w-8 h-8" />
                공동구매 게시하기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
