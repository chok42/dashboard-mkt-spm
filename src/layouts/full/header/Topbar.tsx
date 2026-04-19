const Topbar = () => {
    return (
        <div className="py-[15px] px-6 z-40 sticky top-0 bg-[linear-gradient(90deg,_#0f0533_0%,_#1b0a5c_100%)]">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="md:flex hidden items-center gap-5">
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
                    <div className="flex flex-col sm:flex-row items-center gap-[10px]">
                        <div className="flex items-center gap-[10px]">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Topbar