// Label tipe kos di pojok foto: ♂ & ♀ (campur), ♀ PUTRI, ♂ PUTRA
export default function GenderBadge({ type }) {
  const male = <span className="text-[15px] font-bold leading-none text-[#3d4fd1]">♂</span>;
  const female = <span className="text-[15px] font-bold leading-none text-[#c23a6b]">♀</span>;
  return (
    <span className="absolute left-2 top-2 z-[1] inline-flex h-6 items-center gap-1 rounded-md border border-[#b7b7b7] bg-[#ffffffe5] px-1.5 font-roboto text-sm font-semibold">
      {type === "campur" && (
        <>
          {male}
          <span className="text-black">&amp;</span>
          {female}
        </>
      )}
      {type === "putri" && (
        <>
          {female}
          <span className="text-[#c23a6b]">PUTRI</span>
        </>
      )}
      {type === "putra" && (
        <>
          {male}
          <span className="text-[#3d4fd1]">PUTRA</span>
        </>
      )}
    </span>
  );
}
