import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Camera, Sparkles, Loader2, Layers, Percent } from "lucide-react";
import { Modal, Button, Input } from '../../../app/DesignSystem';
import { useAiService } from "@/lib/hooks/useAiService";
import { closetApi } from "@/lib/api/closetApi";

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ClothingForm {
    name: string;
    category: string;
    season: string;
    color: string;
    material: string;
    description: string;
    thickness: "THIN" | "NORMAL" | "THICK";
    mixRatio: number;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
    const { analyzeImage, loading: aiLoading } = useAiService();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // 폼 상태 관리
    const [form, setForm] = useState<ClothingForm>({
        name: "",
        category: "Top",
        season: "All Seasons",
        color: "",
        material: "",
        description: "",
        thickness: "NORMAL",
        mixRatio: 100,
    });

    // 모달 닫힐 때 초기화
    useEffect(() => {
        if (!isOpen) {
            setPreview(null);
            setForm({
                name: "",
                category: "Top",
                season: "All Seasons",
                color: "",
                material: "",
                description: "",
                thickness: "NORMAL",
                mixRatio: 100,
            });
        }
    }, [isOpen]);

    const handleInputChange = (field: keyof ClothingForm, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPreview(base64String);

            try {
                const result = await analyzeImage(base64String);
                setForm((prev) => ({
                    ...prev,
                    name: result.description || prev.name,
                    category: result.category || prev.category,
                    season: result.season && result.season.length > 0 ? result.season[0] : prev.season,
                    color: result.color || prev.color,
                    material: result.material || prev.material,
                    description: result.description || "",
                }));
            } catch (error) {
                alert("이미지 분석에 실패했습니다. 직접 입력해주세요.");
            }
        };
        reader.readAsDataURL(file);
    };

    // 저장 버튼 핸들러
    const handleSave = async () => {
        if (!form.name) {
            alert("아이템 이름을 입력해주세요!");
            return;
        }

        // 1. 카테고리 매핑 (UI -> Backend Enum)
        const categoryMap: Record<string, string> = {
            "Top": "TOP",
            "Bottom": "BOTTOM",
            "Outerwear": "OUTER",
            "Dress": "ONE_PIECE",
            "Shoes": "ACCESSORY", // 백엔드에 SHOES가 없으면 ACCESSORY나 BOTTOM으로 매핑
            "Accessory": "ACCESSORY"
        };

        // 2. 시즌 매핑
        const seasonList = form.season === "All Seasons"
            ? ["SPRING", "SUMMER", "AUTUMN", "WINTER"]
            : [form.season.toUpperCase()];

        // 3. 백엔드로 보낼 데이터 조립 (DTO Spec 준수)
        const requestData = {
            // [필수] ID 자동 생성 (임시)
            clothingId: Date.now(),

            // [필수] 기본 정보
            name: form.name,
            category: categoryMap[form.category] || "TOP",
            thicknessLevel: form.thickness, // 변수명 주의 (thickness -> thicknessLevel)

            // [필수] 숨겨진 값들 (Default Values) 🤫
            usageType: "BOTH",       // 실내외 겸용 기본값
            suitableMinTemp: -20,    // 기본 온도 범위
            suitableMaxTemp: 35,

            seasons: seasonList,

            // [선택] 혼방률 처리 (간단히 Cotton에 할당하거나 로직 추가 가능)
            cottonPercentage: form.mixRatio,
            polyesterPercentage: 100 - form.mixRatio,
            etcFiberPercentage: 0,

            color: form.color,
            styleTag: form.material, // 임시 태그
            imageUrl: preview || ""        // 이미지 URL은 실제 업로드 로직 구현 시 추가
        };

        try {
            console.log("🚀 백엔드 전송 데이터:", requestData);
            await closetApi.createClothing(requestData);

            alert("옷장에 저장되었습니다!");
            onClose();
            window.location.reload();
        } catch (error) {
            console.error("저장 에러:", error);
            alert("저장에 실패했습니다. 필수값을 확인해주세요.");
        }
    };


    // 공통 라벨 스타일 컴포넌트
    const Label = ({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) => (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            {Icon && <Icon size={14} className="text-slate-400" />}
            {children}
        </label>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Closet Item"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save to Closet</Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* 이미지 업로드 영역 */}
                <div
                    onClick={() => !aiLoading && fileInputRef.current?.click()}
                    className={`w-full h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all relative overflow-hidden group ${aiLoading ? 'pointer-events-none' : ''}`}
                >
                    {preview ? (
                        <>
                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            {aiLoading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                                    <span className="text-xs font-bold text-orange-500 animate-pulse">AI ANALYZING...</span>
                                </div>
                            )}
                            {!aiLoading && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2">
                                    <Camera size={20} /> Change Photo
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="text-3xl mb-2">📸</span>
                            <span className="text-sm font-bold text-navy-800">Click to upload photo</span>
                            <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                        </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                {/* 아이템 이름 (직접 Label 적용) */}
                <div>
                    <Label>Item Name</Label>
                    <input
                        type="text"
                        placeholder={aiLoading ? "Analysing..." : "e.g. Blue Striped Shirt"}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10 outline-none transition-all"
                        value={form.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                </div>

                {/* 카테고리 & 시즌 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Category</Label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-navy-900/10 focus:bg-white transition-all appearance-none"
                            value={form.category}
                            onChange={(e) => handleInputChange("category", e.target.value)}
                        >
                            <option value="Top">Top</option>
                            <option value="Bottom">Bottom</option>
                            <option value="Outerwear">Outerwear</option>
                            <option value="Shoes">Shoes</option>
                            <option value="Accessory">Accessory</option>
                            <option value="Dress">Dress</option>
                        </select>
                    </div>
                    <div>
                        <Label>Season</Label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-navy-900/10 focus:bg-white transition-all appearance-none"
                            value={form.season}
                            onChange={(e) => handleInputChange("season", e.target.value)}
                        >
                            <option value="All Seasons">All Seasons</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                            <option value="Autumn">Autumn</option>
                            <option value="Winter">Winter</option>
                        </select>
                    </div>
                </div>

                {/* 색상 & 두께감 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Primary Color</Label>
                        <input
                            type="text"
                            placeholder="e.g. Navy Blue"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10 outline-none transition-all"
                            value={form.color}
                            onChange={(e) => handleInputChange("color", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Thickness</Label>
                        <div className="flex bg-slate-100 p-1 rounded-xl h-[46px]">
                            {(['THIN', 'NORMAL', 'THICK'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleInputChange("thickness", t)}
                                    className={`flex-1 rounded-lg text-[10px] font-bold transition-all ${
                                        form.thickness === t
                                            ? "bg-white text-navy-900 shadow-sm"
                                            : "text-slate-400 hover:text-navy-900"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 소재 & 혼방률 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Material</Label>
                        <input
                            type="text"
                            placeholder="e.g. Cotton"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10 outline-none transition-all"
                            value={form.material}
                            onChange={(e) => handleInputChange("material", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Mix Ratio (%)</Label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="100"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10 outline-none transition-all"
                            value={form.mixRatio}
                            onChange={(e) => {
                                let val = parseInt(e.target.value, 10);
                                if (isNaN(val)) val = 0;
                                val = Math.min(100, Math.max(0, val));
                                handleInputChange("mixRatio", val);
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};