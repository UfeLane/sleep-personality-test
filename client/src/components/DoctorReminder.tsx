import { motion } from 'framer-motion';

interface DoctorReminderProps {
  showDoctorReminder: boolean;
  showMedicationNotice: boolean;
}

const DOCTOR_REMINDER_TEXT =
  '你的自评结果提示睡眠困扰较明显。建议持续记录睡眠变化，如问题持续存在、影响白天学习、工作或生活，或正在使用助眠相关药物，请咨询医生或专业医疗人员。';

const MEDICATION_NOTICE_TEXT =
  '如正在使用助眠或安眠相关处方药，请遵医嘱，不自行增减、停用或更换药物。建议记录用药时间、睡眠变化和次日状态，并在复诊时与医生沟通。';

export default function DoctorReminder({
  showDoctorReminder,
  showMedicationNotice,
}: DoctorReminderProps) {
  if (!showDoctorReminder && !showMedicationNotice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="space-y-3"
    >
      {/* Doctor Reminder Banner */}
      {showDoctorReminder && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-3xl">
          <div className="flex-shrink-0 w-12 h-12">
            <img
              src="/assets/doctor-reminder.png"
              alt="医生提醒"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold text-amber-800">医生提醒</p>
            <p className="text-xs text-amber-700/90 leading-relaxed">
              {DOCTOR_REMINDER_TEXT}
            </p>
          </div>
        </div>
      )}

      {/* Medication Notice */}
      {showMedicationNotice && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-3xl">
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold text-red-800">用药提醒</p>
            <p className="text-xs text-red-700/90 leading-relaxed">
              {MEDICATION_NOTICE_TEXT}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
