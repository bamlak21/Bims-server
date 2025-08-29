import { Notifications } from "../models/notifications.model.js";

export const GetNotifications = async (req, res) => {
  const userId = req.user.id;

  const { page = 1, limit = 10, read } = req.query;

  const query = { user_id: userId, is_read: read };
  if (read === true) return (query.is_read = true);
  else if (read === false) return (query.is_read = false);

  try {
    const notifications = await Notifications.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Notifications.countDocuments(query);
    return res.status(200).json({
      page: Number(page),
      limit: Number(limit),
      total,
      notifications,
    });
  } catch (err) {
    console.log(err.message);

    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const notification = await Notifications.findOne({
      _id: id,
      user_id: userId,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await Notifications.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
