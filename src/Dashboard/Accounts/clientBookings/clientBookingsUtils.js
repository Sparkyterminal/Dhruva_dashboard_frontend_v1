import dayjs from "dayjs";

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs(dateString).format("DD MMM YYYY");
};

export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export const getEventName = (eventName) => {
  if (typeof eventName === "string") return eventName;
  return eventName?.name || "N/A";
};

export const isSingleDisplayEvent = (record) => {
  const eventNameStr = getEventName(record.eventName);
  if (
    eventNameStr === "Wedding" &&
    record.advancePaymentType === "complete"
  ) {
    return true;
  }
  if (eventNameStr !== "Wedding") return true;
  return false;
};

export const isCompletePaymentWedding = (record) => {
  const eventNameStr = getEventName(record.eventName);
  return (
    eventNameStr === "Wedding" && record.advancePaymentType === "complete"
  );
};

export const getTotalPayable = (record) => {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.totalPayable || 0;
  }
  return (
    record.eventTypes?.reduce(
      (sum, et) => sum + (et.totalPayable || 0),
      0,
    ) || 0
  );
};

export const getTotalAgreedAmount = (record) => {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.agreedAmount || 0;
  }
  return (
    record.eventTypes?.reduce(
      (sum, et) => sum + (et.agreedAmount || 0),
      0,
    ) || 0
  );
};

export const getTotalExpectedAdvances = (record) => {
  let total = 0;
  if (isCompletePaymentWedding(record)) {
    record.eventTypes?.[0]?.advances?.forEach((adv) => {
      total += adv.expectedAmount || 0;
    });
  } else {
    record.eventTypes?.forEach((et) => {
      et.advances?.forEach((adv) => {
        total += adv.expectedAmount || 0;
      });
    });
  }
  return total;
};

export const getTotalReceivedAdvances = (record) => {
  let total = 0;
  if (isCompletePaymentWedding(record)) {
    record.eventTypes?.[0]?.advances?.forEach((adv) => {
      total += adv.receivedAmount || 0;
    });
  } else {
    record.eventTypes?.forEach((et) => {
      et.advances?.forEach((adv) => {
        total += adv.receivedAmount || 0;
      });
    });
  }
  return total;
};
